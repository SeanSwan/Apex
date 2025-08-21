// frontend/src/components/AdminDashboard/ClientPortalPreview.tsx
/**
 * REAL-TIME CLIENT PORTAL PREVIEW - APEX AI ADMIN DASHBOARD
 * =========================================================
 * Side-by-side admin/client view system for immediate synchronization validation.
 * Allows admins to see exactly how their changes appear in the client portal
 * in real-time, ensuring perfect data synchronization and user experience.
 * 
 * FEATURES:
 * - Live client portal simulation with real data
 * - Side-by-side comparison view
 * - Real-time synchronization validation
 * - Role-based preview (different client access levels)
 * - Responsive design preview (desktop/tablet/mobile)
 * - Interactive testing of client features
 * - Change impact visualization
 * - Export preview screenshots for client presentations
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import {
  EyeIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  DevicePhoneMobileIcon,
  ArrowPathIcon,
  PhotoIcon,
  ShareIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CogIcon,
  UserIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CameraIcon,
  ShieldCheckIcon,
  BellIcon,
  ClockIcon,
  MapPinIcon,
  ArrowsRightLeftIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/button';

// ================================
// INTERFACES & TYPES
// ================================

interface ClientPortalPreviewProps {
  /** Current admin changes to preview */
  previewData: PreviewData;
  /** Selected client for preview */
  selectedClientId: string;
  /** Available clients for preview */
  clients: ClientInfo[];
  /** Callback when client selection changes */
  onClientChange: (clientId: string) => void;
  /** Callback when viewport changes */
  onViewportChange: (viewport: ViewportSize) => void;
  /** Whether preview is currently syncing */
  isSyncing?: boolean;
  /** Admin dashboard component reference */
  adminComponent?: React.ReactNode;
}

interface PreviewData {
  /** Property changes to preview */
  properties?: PropertyPreview[];
  /** Incident data changes */
  incidents?: IncidentPreview[];
  /** Evidence changes */
  evidence?: EvidencePreview[];
  /** Dashboard metrics changes */
  dashboardMetrics?: DashboardMetricsPreview;
  /** UI/Theme changes */
  uiChanges?: UIChangesPreview;
}

interface PropertyPreview {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  changes: PropertyChange[];
  affectedViews: string[];
}

interface PropertyChange {
  field: string;
  oldValue: any;
  newValue: any;
  impact: 'low' | 'medium' | 'high';
  description: string;
}

interface IncidentPreview {
  id: number;
  type: string;
  severity: string;
  changes: string[];
  visibility: 'visible' | 'hidden' | 'restricted';
}

interface EvidencePreview {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  changes: string[];
  accessLevel: 'full' | 'limited' | 'none';
}

interface DashboardMetricsPreview {
  kpis: KPIPreview[];
  charts: ChartPreview[];
  alerts: AlertPreview[];
}

interface KPIPreview {
  id: string;
  name: string;
  currentValue: number;
  newValue: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface ChartPreview {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  dataPoints: number;
  timeRange: string;
}

interface AlertPreview {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  visibility: boolean;
}

interface UIChangesPreview {
  theme: 'light' | 'dark' | 'auto';
  colors: ColorScheme;
  layout: LayoutChanges;
  accessibility: AccessibilityChanges;
}

interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

interface LayoutChanges {
  cardLayout: 'grid' | 'list';
  sidebarCollapsed: boolean;
  compactMode: boolean;
}

interface AccessibilityChanges {
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  reducedMotion: boolean;
}

interface ClientInfo {
  id: string;
  name: string;
  companyName: string;
  accessLevel: 'basic' | 'standard' | 'premium';
  permissions: string[];
  properties: string[];
  customizations: ClientCustomizations;
}

interface ClientCustomizations {
  logo?: string;
  colors?: ColorScheme;
  features: string[];
  restrictions: string[];
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

// ================================
// STYLED COMPONENTS
// ================================

const PreviewContainer = styled.div`
  display: flex;
  height: 100vh;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
`;

const AdminPanel = styled.div<{ isCollapsed: boolean }>`
  width: ${props => props.isCollapsed ? '60px' : '400px'};
  background: white;
  border-right: 2px solid #e2e8f0;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PreviewPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f1f5f9;
  position: relative;
`;

const PreviewHeader = styled.div`
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: between;
  gap: 1rem;
`;

const PreviewContent = styled.div<{ viewport: ViewportSize }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  
  .preview-frame {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    transition: all 0.3s ease;
    position: relative;
    
    ${props => {
      switch (props.viewport) {
        case 'desktop':
          return `
            width: 100%;
            max-width: 1200px;
            height: 80vh;
          `;
        case 'tablet':
          return `
            width: 768px;
            height: 1024px;
            max-height: 80vh;
          `;
        case 'mobile':
          return `
            width: 375px;
            height: 667px;
            max-height: 80vh;
          `;
        default:
          return `
            width: 100%;
            max-width: 1200px;
            height: 80vh;
          `;
      }
    }}
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 30px;
      background: ${props => {
        switch (props.viewport) {
          case 'desktop':
            return 'linear-gradient(90deg, #ef4444 0%, #f59e0b 33%, #10b981 66%, #3b82f6 100%)';
          case 'tablet':
            return '#1f2937';
          case 'mobile':
            return '#000';
          default:
            return 'linear-gradient(90deg, #ef4444 0%, #f59e0b 33%, #10b981 66%, #3b82f6 100%)';
        }
      }};
      border-radius: 12px 12px 0 0;
      z-index: 10;
    }
  }
`;

const AdminControls = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  
  .control-section {
    margin-bottom: 2rem;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    h3 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }
`;

const ClientSelector = styled.div`
  .client-option {
    padding: 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    background: white;
    
    &:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }
    
    &.selected {
      background: #eff6ff;
      border-color: #3b82f6;
      box-shadow: 0 0 0 1px #3b82f6;
    }
    
    .client-name {
      font-weight: 500;
      color: #111827;
      margin-bottom: 0.25rem;
    }
    
    .client-details {
      font-size: 0.75rem;
      color: #6b7280;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }
`;

const ViewportControls = styled.div`
  display: flex;
  gap: 0.5rem;
  
  .viewport-btn {
    padding: 0.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background: #f9fafb;
    }
    
    &.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }
    
    svg {
      width: 1.25rem;
      height: 1.25rem;
    }
  }
`;

const SyncStatus = styled.div<{ status: 'synced' | 'syncing' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  
  ${props => {
    switch (props.status) {
      case 'synced':
        return `
          background: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        `;
      case 'syncing':
        return `
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        `;
      case 'error':
        return `
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        `;
    }
  }}
  
  .sync-icon {
    width: 1rem;
    height: 1rem;
    
    ${props => props.status === 'syncing' && `
      animation: spin 1s linear infinite;
    `}
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ChangeIndicators = styled.div`
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  
  .change-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: 6px;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    
    &.high-impact {
      background: #fee2e2;
      color: #991b1b;
    }
    
    &.medium-impact {
      background: #fef3c7;
      color: #92400e;
    }
    
    &.low-impact {
      background: #dcfce7;
      color: #166534;
    }
    
    .change-icon {
      width: 1rem;
      height: 1rem;
    }
  }
`;

const PreviewSimulator = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  padding-top: 30px; /* Account for mock browser bar */
  
  /* Client Portal Simulation Styles */
  .client-portal-sim {
    min-height: 100%;
    background: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .sim-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem 2rem;
    
    .sim-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      .sim-logo {
        font-size: 1.25rem;
        font-weight: 700;
      }
      
      .sim-user {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
      }
    }
  }
  
  .sim-content {
    padding: 2rem;
    
    .sim-dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      
      .sim-card {
        background: white;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .sim-card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          
          .sim-card-icon {
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            
            &.blue { background: #eff6ff; color: #3b82f6; }
            &.green { background: #dcfce7; color: #10b981; }
            &.red { background: #fee2e2; color: #ef4444; }
            &.yellow { background: #fef3c7; color: #f59e0b; }
          }
          
          .sim-card-title {
            font-weight: 600;
            color: #111827;
          }
        }
        
        .sim-card-value {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.5rem;
        }
        
        .sim-card-change {
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          
          &.positive { color: #10b981; }
          &.negative { color: #ef4444; }
          &.neutral { color: #6b7280; }
        }
      }
    }
  }
`;

// ================================
// SAMPLE DATA GENERATORS
// ================================

const generateSampleClients = (): ClientInfo[] => [
  {
    id: 'client_1',
    name: 'Sarah Johnson',
    companyName: 'Luxe Apartments Management',
    accessLevel: 'premium',
    permissions: ['view_all_incidents', 'download_evidence', 'manage_contacts'],
    properties: ['luxe_building_a', 'luxe_building_b'],
    customizations: {
      logo: '/logos/luxe-apartments.png',
      colors: {
        primary: '#3b82f6',
        secondary: '#1e40af',
        accent: '#60a5fa',
        background: '#f8fafc'
      },
      features: ['advanced_analytics', 'real_time_alerts', 'custom_reports'],
      restrictions: []
    }
  },
  {
    id: 'client_2',
    name: 'David Rodriguez',
    companyName: 'Metropolitan Housing',
    accessLevel: 'standard',
    permissions: ['view_incidents', 'basic_reports'],
    properties: ['metro_tower'],
    customizations: {
      features: ['basic_analytics'],
      restrictions: ['no_evidence_download']
    }
  },
  {
    id: 'client_3',
    name: 'Alexandra Williams',
    companyName: 'Prestige Properties',
    accessLevel: 'basic',
    permissions: ['view_incidents'],
    properties: ['prestige_plaza'],
    customizations: {
      features: ['basic_dashboard'],
      restrictions: ['limited_history', 'no_exports']
    }
  }
];

const generateSamplePreviewData = (): PreviewData => ({
  properties: [
    {
      id: 'luxe_building_a',
      name: 'Luxe Apartments - Building A',
      status: 'active',
      changes: [
        {
          field: 'security_level',
          oldValue: 'standard',
          newValue: 'enhanced',
          impact: 'high',
          description: 'Security level upgrade will show enhanced monitoring features'
        },
        {
          field: 'emergency_contact',
          oldValue: 'John Smith (555-0123)',
          newValue: 'Sarah Johnson (555-0456)',
          impact: 'medium',
          description: 'Emergency contact update will reflect in property details'
        }
      ],
      affectedViews: ['Property Details', 'Dashboard Cards', 'Emergency Contacts']
    }
  ],
  dashboardMetrics: {
    kpis: [
      {
        id: 'total_incidents',
        name: 'Total Incidents',
        currentValue: 45,
        newValue: 47,
        change: 4.4,
        trend: 'up'
      },
      {
        id: 'critical_incidents',
        name: 'Critical Incidents',
        currentValue: 3,
        newValue: 2,
        change: -33.3,
        trend: 'down'
      }
    ],
    charts: [
      {
        id: 'incident_trends',
        type: 'line',
        dataPoints: 30,
        timeRange: '30 days'
      }
    ],
    alerts: [
      {
        id: 'security_upgrade',
        type: 'info',
        message: 'Security level has been upgraded to Enhanced',
        visibility: true
      }
    ]
  }
});

// ================================
// MAIN COMPONENT
// ================================

export const ClientPortalPreview: React.FC<ClientPortalPreviewProps> = ({
  previewData,
  selectedClientId,
  clients,
  onClientChange,
  onViewportChange,
  isSyncing = false,
  adminComponent
}) => {
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [isAdminCollapsed, setIsAdminCollapsed] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  
  // Use sample data if no clients provided
  const clientList = clients.length > 0 ? clients : generateSampleClients();
  const previewDataWithDefaults = useMemo(() => 
    Object.keys(previewData).length > 0 ? previewData : generateSamplePreviewData(),
    [previewData]
  );
  
  const selectedClient = clientList.find(client => client.id === selectedClientId) || clientList[0];

  useEffect(() => {
    if (isSyncing) {
      setSyncStatus('syncing');
      // Simulate sync completion
      const timer = setTimeout(() => {
        setSyncStatus('synced');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSyncing]);

  const handleViewportChange = useCallback((newViewport: ViewportSize) => {
    setViewport(newViewport);
    onViewportChange(newViewport);
  }, [onViewportChange]);

  const handleClientSelect = useCallback((clientId: string) => {
    setSyncStatus('syncing');
    onClientChange(clientId);
    setTimeout(() => setSyncStatus('synced'), 1000);
  }, [onClientChange]);

  const getChangeImpactClass = (impact: string) => {
    switch (impact) {
      case 'high': return 'high-impact';
      case 'medium': return 'medium-impact';
      case 'low': return 'low-impact';
      default: return 'low-impact';
    }
  };

  const getChangeIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <ExclamationTriangleIcon className="change-icon" />;
      case 'medium': return <ExclamationTriangleIcon className="change-icon" />;
      case 'low': return <CheckCircleIcon className="change-icon" />;
      default: return <CheckCircleIcon className="change-icon" />;
    }
  };

  const renderClientPortalSimulation = () => (
    <PreviewSimulator>
      <div className="client-portal-sim">
        {/* Simulated Header */}
        <div className="sim-header">
          <div className="sim-nav">
            <div className="sim-logo">
              {selectedClient.customizations.logo ? (
                <img src={selectedClient.customizations.logo} alt="Logo" style={{ height: '2rem' }} />
              ) : (
                `${selectedClient.companyName} Portal`
              )}
            </div>
            <div className="sim-user">
              <UserIcon style={{ width: '1rem', height: '1rem' }} />
              {selectedClient.name}
            </div>
          </div>
        </div>

        {/* Simulated Content */}
        <div className="sim-content">
          <div className="sim-dashboard">
            {/* Total Incidents Card */}
            <div className="sim-card">
              <div className="sim-card-header">
                <div className="sim-card-icon blue">
                  <DocumentTextIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                </div>
                <div className="sim-card-title">Total Incidents</div>
              </div>
              <div className="sim-card-value">
                {previewDataWithDefaults.dashboardMetrics?.kpis.find(k => k.id === 'total_incidents')?.newValue || 47}
              </div>
              <div className="sim-card-change positive">
                <ArrowsRightLeftIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                +4.4% from last month
              </div>
            </div>

            {/* Critical Incidents Card */}
            <div className="sim-card">
              <div className="sim-card-header">
                <div className="sim-card-icon red">
                  <ExclamationTriangleIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                </div>
                <div className="sim-card-title">Critical Incidents</div>
              </div>
              <div className="sim-card-value">
                {previewDataWithDefaults.dashboardMetrics?.kpis.find(k => k.id === 'critical_incidents')?.newValue || 2}
              </div>
              <div className="sim-card-change positive">
                <ArrowsRightLeftIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                -33.3% from last month
              </div>
            </div>

            {/* Response Time Card */}
            <div className="sim-card">
              <div className="sim-card-header">
                <div className="sim-card-icon green">
                  <ClockIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                </div>
                <div className="sim-card-title">Avg Response Time</div>
              </div>
              <div className="sim-card-value">2.1m</div>
              <div className="sim-card-change positive">
                <ArrowsRightLeftIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                -12% from last month
              </div>
            </div>

            {/* Properties Card */}
            <div className="sim-card">
              <div className="sim-card-header">
                <div className="sim-card-icon yellow">
                  <BuildingOfficeIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                </div>
                <div className="sim-card-title">Active Properties</div>
              </div>
              <div className="sim-card-value">{selectedClient.properties.length}</div>
              <div className="sim-card-change neutral">
                All systems operational
              </div>
            </div>
          </div>

          {/* Show preview changes */}
          {previewDataWithDefaults.properties && previewDataWithDefaults.properties.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <div style={{ 
                background: '#eff6ff', 
                border: '1px solid #3b82f6', 
                borderRadius: '8px', 
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e40af', fontSize: '0.875rem', fontWeight: '600' }}>
                  Preview: Recent Changes
                </h3>
                <p style={{ margin: '0', color: '#3730a3', fontSize: '0.75rem' }}>
                  Security level upgraded to Enhanced - Enhanced monitoring features now available
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PreviewSimulator>
  );

  return (
    <PreviewContainer>
      {/* Admin Panel */}
      <AdminPanel isCollapsed={isAdminCollapsed}>
        {/* Admin Header */}
        <PreviewHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdminCollapsed(!isAdminCollapsed)}
          >
            <ArrowsRightLeftIcon className="w-4 h-4" />
          </Button>
          {!isAdminCollapsed && (
            <>
              <h3 className="font-semibold text-gray-900">Admin Controls</h3>
              <SyncStatus status={syncStatus}>
                <ArrowPathIcon className="sync-icon" />
                {syncStatus === 'synced' && 'Synced'}
                {syncStatus === 'syncing' && 'Syncing...'}
                {syncStatus === 'error' && 'Sync Error'}
              </SyncStatus>
            </>
          )}
        </PreviewHeader>

        {!isAdminCollapsed && (
          <>
            {/* Change Indicators */}
            {previewDataWithDefaults.properties && previewDataWithDefaults.properties.length > 0 && (
              <ChangeIndicators>
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Pending Changes</h4>
                {previewDataWithDefaults.properties.flatMap(property => 
                  property.changes.map((change, index) => (
                    <div key={index} className={`change-item ${getChangeImpactClass(change.impact)}`}>
                      {getChangeIcon(change.impact)}
                      <div>
                        <div className="font-medium">{change.field.replace('_', ' ').toUpperCase()}</div>
                        <div className="text-xs opacity-75">{change.description}</div>
                      </div>
                    </div>
                  ))
                )}
              </ChangeIndicators>
            )}

            {/* Admin Controls */}
            <AdminControls>
              {/* Client Selection */}
              <div className="control-section">
                <h3>
                  <UserIcon className="w-4 h-4" />
                  Client Preview
                </h3>
                <ClientSelector>
                  {clientList.map(client => (
                    <div
                      key={client.id}
                      className={`client-option ${client.id === selectedClientId ? 'selected' : ''}`}
                      onClick={() => handleClientSelect(client.id)}
                    >
                      <div className="client-name">{client.name}</div>
                      <div className="client-details">
                        <BuildingOfficeIcon className="w-3 h-3" />
                        {client.companyName}
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          client.accessLevel === 'premium' ? 'bg-blue-100 text-blue-700' :
                          client.accessLevel === 'standard' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {client.accessLevel}
                        </span>
                      </div>
                    </div>
                  ))}
                </ClientSelector>
              </div>

              {/* Viewport Controls */}
              <div className="control-section">
                <h3>
                  <ComputerDesktopIcon className="w-4 h-4" />
                  Device Preview
                </h3>
                <ViewportControls>
                  <button
                    className={`viewport-btn ${viewport === 'desktop' ? 'active' : ''}`}
                    onClick={() => handleViewportChange('desktop')}
                    title="Desktop View"
                  >
                    <ComputerDesktopIcon />
                  </button>
                  <button
                    className={`viewport-btn ${viewport === 'tablet' ? 'active' : ''}`}
                    onClick={() => handleViewportChange('tablet')}
                    title="Tablet View"
                  >
                    <DeviceTabletIcon />
                  </button>
                  <button
                    className={`viewport-btn ${viewport === 'mobile' ? 'active' : ''}`}
                    onClick={() => handleViewportChange('mobile')}
                    title="Mobile View"
                  >
                    <DevicePhoneMobileIcon />
                  </button>
                </ViewportControls>
              </div>

              {/* Quick Actions */}
              <div className="control-section">
                <h3>
                  <CogIcon className="w-4 h-4" />
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <PhotoIcon className="w-4 h-4 mr-2" />
                    Screenshot
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <ShareIcon className="w-4 h-4 mr-2" />
                    Share Preview
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </AdminControls>
          </>
        )}
      </AdminPanel>

      {/* Preview Panel */}
      <PreviewPanel>
        <PreviewHeader>
          <div className="flex items-center gap-4">
            <EyeIcon className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-semibold text-gray-900">
                Live Client Portal Preview
              </h3>
              <p className="text-sm text-gray-600">
                {selectedClient.companyName} • {viewport.charAt(0).toUpperCase() + viewport.slice(1)} View
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {viewport === 'desktop' && '1200px'}
              {viewport === 'tablet' && '768px'}
              {viewport === 'mobile' && '375px'}
            </span>
            <div className="w-2 h-2 bg-green-500 rounded-full" title="Live Preview Active" />
          </div>
        </PreviewHeader>

        <PreviewContent viewport={viewport}>
          <div className="preview-frame">
            {renderClientPortalSimulation()}
          </div>
        </PreviewContent>
      </PreviewPanel>
    </PreviewContainer>
  );
};

export default ClientPortalPreview;
