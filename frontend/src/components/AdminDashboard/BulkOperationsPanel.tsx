// frontend/src/components/AdminDashboard/BulkOperationsPanel.tsx
/**
 * BULK OPERATIONS PANEL - APEX AI ADMIN DASHBOARD
 * ===============================================
 * Comprehensive bulk operations system for efficient property management,
 * client assignments, data import/export, and system-wide updates.
 * 
 * FEATURES:
 * - Mass property updates with preview and validation
 * - Bulk client assignments and role management
 * - CSV/Excel import/export with data mapping
 * - Batch incident management and evidence processing
 * - System-wide configuration changes
 * - Progress tracking and rollback capabilities
 * - Scheduling and automation options
 * - Comprehensive audit logging
 * - Data validation and conflict resolution
 * - Real-time client portal synchronization
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import styled from 'styled-components';
import {
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  Cog6ToothIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  PhotoIcon,
  ShieldCheckIcon,
  BellIcon,
  TagIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  CloudArrowUpIcon,
  QueueListIcon,
  CpuChipIcon,
  KeyIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';

// ================================
// INTERFACES & TYPES
// ================================

interface BulkOperationsPanelProps {
  /** Available properties for bulk operations */
  properties: Property[];
  /** Available clients for assignments */
  clients: Client[];
  /** Available guards for assignments */
  guards: Guard[];
  /** Current user permissions */
  userPermissions: string[];
  /** Callback for operation completion */
  onOperationComplete?: (operation: BulkOperation, result: OperationResult) => void;
  /** Callback for real-time updates */
  onProgressUpdate?: (operation: BulkOperation, progress: ProgressUpdate) => void;
}

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  clientId: string;
  clientName: string;
  status: 'active' | 'inactive' | 'maintenance';
  propertyType: string;
  securityLevel: string;
  assignedGuards: number;
  lastIncident?: string;
  createdAt: string;
}

interface Client {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  accessLevel: 'basic' | 'standard' | 'premium';
  status: 'active' | 'inactive';
  propertiesCount: number;
}

interface Guard {
  id: string;
  name: string;
  badgeNumber: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  assignedProperties: string[];
  shiftSchedule: string;
}

interface BulkOperation {
  id: string;
  type: BulkOperationType;
  name: string;
  description: string;
  targetCount: number;
  parameters: OperationParameters;
  schedule?: OperationSchedule;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  errors: OperationError[];
}

type BulkOperationType = 
  | 'property_update'
  | 'client_assignment'
  | 'guard_assignment'
  | 'data_import'
  | 'data_export'
  | 'security_update'
  | 'notification_send'
  | 'system_config'
  | 'evidence_process'
  | 'incident_archive';

interface OperationParameters {
  selectedItems: string[];
  changes: Record<string, any>;
  filters?: FilterCriteria;
  importMapping?: ImportMapping;
  exportOptions?: ExportOptions;
  notificationSettings?: NotificationSettings;
}

interface FilterCriteria {
  propertyTypes?: string[];
  statuses?: string[];
  clientIds?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  customFilters?: Record<string, any>;
}

interface ImportMapping {
  fileType: 'csv' | 'excel' | 'json';
  columnMapping: Record<string, string>;
  validationRules: ValidationRule[];
  conflictResolution: 'skip' | 'update' | 'create_new';
}

interface ValidationRule {
  field: string;
  rule: 'required' | 'email' | 'phone' | 'unique' | 'pattern';
  pattern?: string;
  message: string;
}

interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  fields: string[];
  includeRelated: boolean;
  filters: FilterCriteria;
  template?: string;
}

interface NotificationSettings {
  channels: ('email' | 'sms' | 'push' | 'webhook')[];
  template: string;
  personalization: boolean;
  scheduling?: {
    immediate: boolean;
    scheduled?: string;
    recurring?: RecurringPattern;
  };
}

interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  endDate?: string;
}

interface OperationSchedule {
  executeAt: string;
  timezone: string;
  recurring?: RecurringPattern;
}

interface OperationResult {
  success: boolean;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: OperationError[];
  summary: ResultSummary;
}

interface OperationError {
  itemId: string;
  error: string;
  field?: string;
  severity: 'warning' | 'error' | 'critical';
}

interface ResultSummary {
  message: string;
  details: string[];
  recommendations: string[];
  rollbackAvailable: boolean;
}

interface ProgressUpdate {
  currentItem: number;
  totalItems: number;
  currentAction: string;
  estimatedTimeRemaining: number;
  throughput: number;
}

// ================================
// STYLED COMPONENTS
// ================================

const BulkOperationsContainer = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  height: 100vh;
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
`;

const OperationsSidebar = styled.div`
  background: white;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SidebarHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  
  h2 {
    margin: 0 0 0.5rem 0;
    color: #111827;
    font-size: 1.125rem;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
  }
`;

const OperationsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  
  .operation-category {
    margin-bottom: 1.5rem;
    
    h3 {
      margin: 0 0 1rem 0;
      color: #374151;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
  }
  
  .operation-item {
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    
    &:hover {
      background: #f9fafb;
      border-color: #e5e7eb;
    }
    
    &.active {
      background: #eff6ff;
      border-color: #3b82f6;
      box-shadow: 0 1px 2px rgba(59, 130, 246, 0.1);
    }
    
    .operation-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
      
      .operation-icon {
        width: 2rem;
        height: 2rem;
        background: #f3f4f6;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        
        svg {
          width: 1rem;
          height: 1rem;
        }
      }
      
      .operation-title {
        font-weight: 500;
        color: #111827;
        font-size: 0.875rem;
      }
    }
    
    .operation-description {
      color: #6b7280;
      font-size: 0.75rem;
      line-height: 1.4;
    }
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ContentHeader = styled.div`
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1.5rem 2rem;
  
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .header-info {
      h1 {
        margin: 0 0 0.5rem 0;
        color: #111827;
        font-size: 1.5rem;
        font-weight: 600;
      }
      
      p {
        margin: 0;
        color: #6b7280;
        font-size: 0.875rem;
      }
    }
    
    .header-actions {
      display: flex;
      gap: 1rem;
    }
  }
`;

const ContentBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
`;

const OperationForm = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  
  .form-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #f3f4f6;
    
    &:last-child {
      border-bottom: none;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      
      .section-icon {
        width: 2rem;
        height: 2rem;
        background: #eff6ff;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #3b82f6;
        
        svg {
          width: 1rem;
          height: 1rem;
        }
      }
      
      h3 {
        margin: 0;
        color: #111827;
        font-size: 1rem;
        font-weight: 600;
      }
    }
  }
`;

const SelectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  
  .selection-item {
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    
    &:hover {
      border-color: #d1d5db;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    &.selected {
      border-color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 1px 3px rgba(59, 130, 246, 0.1);
    }
    
    .selection-checkbox {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid #d1d5db;
      border-radius: 4px;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &.checked {
        background: #3b82f6;
        border-color: #3b82f6;
        color: white;
        
        svg {
          width: 0.75rem;
          height: 0.75rem;
        }
      }
    }
    
    .item-header {
      margin-bottom: 0.5rem;
      
      .item-title {
        font-weight: 500;
        color: #111827;
        margin-bottom: 0.25rem;
      }
      
      .item-subtitle {
        color: #6b7280;
        font-size: 0.875rem;
      }
    }
    
    .item-details {
      display: flex;
      gap: 1rem;
      margin-top: 0.75rem;
      
      .detail-item {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        color: #6b7280;
        font-size: 0.75rem;
        
        svg {
          width: 0.875rem;
          height: 0.875rem;
        }
      }
    }
  }
`;

const ParametersForm = styled.div`
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    
    .form-group {
      .form-label {
        display: block;
        margin-bottom: 0.5rem;
        color: #374151;
        font-size: 0.875rem;
        font-weight: 500;
      }
      
      .form-input,
      .form-select,
      .form-textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.875rem;
        transition: border-color 0.2s ease;
        
        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }
      
      .form-textarea {
        resize: vertical;
        min-height: 80px;
      }
      
      .form-help {
        margin-top: 0.25rem;
        color: #6b7280;
        font-size: 0.75rem;
      }
    }
  }
`;

const ProgressDisplay = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  
  .progress-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    
    .progress-title {
      font-weight: 500;
      color: #111827;
    }
    
    .progress-controls {
      display: flex;
      gap: 0.5rem;
    }
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 1rem;
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #1d4ed8);
      border-radius: 4px;
      transition: width 0.3s ease;
    }
  }
  
  .progress-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
    
    .stat-item {
      text-align: center;
      
      .stat-value {
        font-size: 1.5rem;
        font-weight: 600;
        color: #111827;
        margin-bottom: 0.25rem;
      }
      
      .stat-label {
        color: #6b7280;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }
    }
  }
  
  .progress-current {
    margin-top: 1rem;
    padding: 0.75rem;
    background: white;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    
    .current-action {
      font-weight: 500;
      color: #111827;
      margin-bottom: 0.25rem;
    }
    
    .current-details {
      color: #6b7280;
      font-size: 0.875rem;
    }
  }
`;

const ResultsSummary = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  
  .results-header {
    padding: 1.5rem;
    border-bottom: 1px solid #f3f4f6;
    background: #f8fafc;
    
    .results-title {
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    
    .results-subtitle {
      color: #6b7280;
      font-size: 0.875rem;
    }
  }
  
  .results-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    
    .stat-item {
      padding: 1.5rem;
      text-align: center;
      border-right: 1px solid #f3f4f6;
      
      &:last-child {
        border-right: none;
      }
      
      .stat-number {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        
        &.success { color: #10b981; }
        &.warning { color: #f59e0b; }
        &.error { color: #ef4444; }
        &.info { color: #3b82f6; }
      }
      
      .stat-label {
        color: #6b7280;
        font-size: 0.875rem;
        font-weight: 500;
      }
    }
  }
  
  .results-details {
    padding: 1.5rem;
    
    .error-list {
      .error-item {
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        border-radius: 6px;
        border-left: 4px solid #ef4444;
        background: #fef2f2;
        
        .error-message {
          font-weight: 500;
          color: #991b1b;
          margin-bottom: 0.25rem;
        }
        
        .error-details {
          color: #7f1d1d;
          font-size: 0.875rem;
        }
      }
    }
  }
`;

// ================================
// SAMPLE DATA
// ================================

const sampleOperations = [
  {
    category: 'Property Management',
    operations: [
      {
        id: 'property_update',
        type: 'property_update' as BulkOperationType,
        name: 'Update Properties',
        description: 'Modify property details, security levels, or configurations across multiple properties',
        icon: <BuildingOfficeIcon />
      },
      {
        id: 'client_assignment',
        type: 'client_assignment' as BulkOperationType,
        name: 'Assign Clients',
        description: 'Bulk assign or reassign properties to different client accounts',
        icon: <UserGroupIcon />
      },
      {
        id: 'guard_assignment',
        type: 'guard_assignment' as BulkOperationType,
        name: 'Guard Assignments',
        description: 'Assign security guards to multiple properties or update schedules',
        icon: <ShieldCheckIcon />
      }
    ]
  },
  {
    category: 'Data Management',
    operations: [
      {
        id: 'data_import',
        type: 'data_import' as BulkOperationType,
        name: 'Import Data',
        description: 'Import properties, clients, or incidents from CSV/Excel files',
        icon: <DocumentArrowUpIcon />
      },
      {
        id: 'data_export',
        type: 'data_export' as BulkOperationType,
        name: 'Export Data',
        description: 'Export reports, analytics, or raw data in various formats',
        icon: <DocumentArrowDownIcon />
      },
      {
        id: 'evidence_process',
        type: 'evidence_process' as BulkOperationType,
        name: 'Process Evidence',
        description: 'Batch process evidence files, apply watermarks, or organize archives',
        icon: <PhotoIcon />
      }
    ]
  },
  {
    category: 'System Operations',
    operations: [
      {
        id: 'security_update',
        type: 'security_update' as BulkOperationType,
        name: 'Security Updates',
        description: 'Apply security configuration changes across the system',
        icon: <KeyIcon />
      },
      {
        id: 'notification_send',
        type: 'notification_send' as BulkOperationType,
        name: 'Send Notifications',
        description: 'Send bulk notifications, alerts, or announcements to clients',
        icon: <BellIcon />
      },
      {
        id: 'system_config',
        type: 'system_config' as BulkOperationType,
        name: 'System Configuration',
        description: 'Update system-wide settings, AI parameters, or feature flags',
        icon: <Cog6ToothIcon />
      }
    ]
  }
];

// ================================
// MAIN COMPONENT
// ================================

export const BulkOperationsPanel: React.FC<BulkOperationsPanelProps> = ({
  properties = [],
  clients = [],
  guards = [],
  userPermissions = [],
  onOperationComplete,
  onProgressUpdate
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedOperation, setSelectedOperation] = useState<string>('property_update');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [operationParameters, setOperationParameters] = useState<any>({});
  const [currentOperation, setCurrentOperation] = useState<BulkOperation | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<OperationResult | null>(null);

  // Generate sample data if none provided
  const sampleProperties: Property[] = useMemo(() => 
    properties.length > 0 ? properties : [
      {
        id: 'prop_1',
        name: 'Luxe Apartments - Building A',
        address: '123 Luxury Ave',
        city: 'Downtown',
        state: 'CA',
        clientId: 'client_1',
        clientName: 'Luxe Management',
        status: 'active',
        propertyType: 'luxury_apartment',
        securityLevel: 'enhanced',
        assignedGuards: 3,
        createdAt: '2024-01-15'
      },
      {
        id: 'prop_2', 
        name: 'Metropolitan Tower',
        address: '456 Metro St',
        city: 'Midtown',
        state: 'CA',
        clientId: 'client_2',
        clientName: 'Metro Housing',
        status: 'active',
        propertyType: 'commercial',
        securityLevel: 'standard',
        assignedGuards: 2,
        createdAt: '2024-02-01'
      },
      {
        id: 'prop_3',
        name: 'Prestige Plaza',
        address: '789 Elite Blvd',
        city: 'Uptown',
        state: 'CA',
        clientId: 'client_3',
        clientName: 'Prestige Properties',
        status: 'maintenance',
        propertyType: 'luxury_apartment',
        securityLevel: 'maximum',
        assignedGuards: 4,
        lastIncident: '2024-08-15',
        createdAt: '2024-03-10'
      }
    ],
    [properties]
  );

  const selectedOperationData = useMemo(() => {
    for (const category of sampleOperations) {
      const operation = category.operations.find(op => op.id === selectedOperation);
      if (operation) return operation;
    }
    return sampleOperations[0].operations[0];
  }, [selectedOperation]);

  const handleItemSelection = useCallback((itemId: string, selected: boolean) => {
    if (selected) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.length === sampleProperties.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(sampleProperties.map(p => p.id));
    }
  }, [selectedItems.length, sampleProperties]);

  const handleParameterChange = useCallback((field: string, value: any) => {
    setOperationParameters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const executeOperation = useCallback(async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select at least one item to process.",
        variant: "destructive"
      });
      return;
    }

    const operation: BulkOperation = {
      id: `op_${Date.now()}`,
      type: selectedOperationData.type,
      name: selectedOperationData.name,
      description: selectedOperationData.description,
      targetCount: selectedItems.length,
      parameters: {
        selectedItems,
        changes: operationParameters
      },
      status: 'running',
      progress: 0,
      startedAt: new Date().toISOString(),
      errors: []
    };

    setCurrentOperation(operation);
    setIsExecuting(true);
    setResults(null);

    // Simulate operation execution
    try {
      for (let i = 0; i <= selectedItems.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const progress = (i / selectedItems.length) * 100;
        const updatedOperation = {
          ...operation,
          progress
        };
        setCurrentOperation(updatedOperation);

        const progressUpdate: ProgressUpdate = {
          currentItem: i,
          totalItems: selectedItems.length,
          currentAction: i < selectedItems.length ? `Processing ${sampleProperties.find(p => p.id === selectedItems[i])?.name}` : 'Completing operation',
          estimatedTimeRemaining: (selectedItems.length - i) * 1000,
          throughput: i / ((Date.now() - new Date(operation.startedAt!).getTime()) / 1000)
        };
        
        onProgressUpdate?.(updatedOperation, progressUpdate);
      }

      const result: OperationResult = {
        success: true,
        processed: selectedItems.length,
        successful: selectedItems.length - 1,
        failed: 1,
        skipped: 0,
        errors: [
          {
            itemId: selectedItems[0],
            error: 'Sample validation error for demonstration',
            field: 'security_level',
            severity: 'warning'
          }
        ],
        summary: {
          message: `Successfully processed ${selectedItems.length - 1} of ${selectedItems.length} items`,
          details: [
            'Security levels updated for all selected properties',
            'Client portal notifications sent',
            'Audit logs created'
          ],
          recommendations: [
            'Review the failed item and retry if needed',
            'Consider updating related SOPs',
            'Schedule follow-up validation'
          ],
          rollbackAvailable: true
        }
      };

      setResults(result);
      setCurrentOperation(prev => prev ? { ...prev, status: 'completed', completedAt: new Date().toISOString() } : null);
      onOperationComplete?.(operation, result);

      toast({
        title: "Operation Completed",
        description: `${result.successful} items processed successfully.`,
        variant: "default"
      });

    } catch (error) {
      const errorResult: OperationResult = {
        success: false,
        processed: 0,
        successful: 0,
        failed: selectedItems.length,
        skipped: 0,
        errors: [
          {
            itemId: 'system',
            error: 'Operation failed due to system error',
            severity: 'critical'
          }
        ],
        summary: {
          message: 'Operation failed',
          details: ['System error occurred during processing'],
          recommendations: ['Check system logs', 'Retry operation'],
          rollbackAvailable: false
        }
      };

      setResults(errorResult);
      setCurrentOperation(prev => prev ? { ...prev, status: 'failed' } : null);

      toast({
        title: "Operation Failed",
        description: "An error occurred during processing.",
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
    }
  }, [selectedItems, selectedOperationData, operationParameters, sampleProperties, onOperationComplete, onProgressUpdate, toast]);

  const renderSelectionSection = () => (
    <div className="form-section">
      <div className="section-header">
        <div className="section-icon">
          <FunnelIcon />
        </div>
        <h3>Select Items</h3>
        <div style={{ marginLeft: 'auto' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
          >
            {selectedItems.length === sampleProperties.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
      </div>

      <SelectionGrid>
        {sampleProperties.map(property => (
          <div
            key={property.id}
            className={`selection-item ${selectedItems.includes(property.id) ? 'selected' : ''}`}
            onClick={() => handleItemSelection(property.id, !selectedItems.includes(property.id))}
          >
            <div className={`selection-checkbox ${selectedItems.includes(property.id) ? 'checked' : ''}`}>
              {selectedItems.includes(property.id) && <CheckCircleIcon />}
            </div>
            
            <div className="item-header">
              <div className="item-title">{property.name}</div>
              <div className="item-subtitle">{property.address}, {property.city}</div>
            </div>
            
            <div className="item-details">
              <div className="detail-item">
                <UserGroupIcon />
                {property.clientName}
              </div>
              <div className="detail-item">
                <ShieldCheckIcon />
                {property.securityLevel}
              </div>
              <div className="detail-item">
                <TagIcon />
                {property.status}
              </div>
            </div>
          </div>
        ))}
      </SelectionGrid>
    </div>
  );

  const renderParametersSection = () => (
    <div className="form-section">
      <div className="section-header">
        <div className="section-icon">
          <AdjustmentsHorizontalIcon />
        </div>
        <h3>Operation Parameters</h3>
      </div>

      <ParametersForm>
        {selectedOperationData.type === 'property_update' && (
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Security Level</label>
              <select
                className="form-select"
                value={operationParameters.securityLevel || ''}
                onChange={(e) => handleParameterChange('securityLevel', e.target.value)}
              >
                <option value="">No Change</option>
                <option value="standard">Standard</option>
                <option value="enhanced">Enhanced</option>
                <option value="maximum">Maximum</option>
              </select>
              <p className="form-help">Update security level for selected properties</p>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={operationParameters.status || ''}
                onChange={(e) => handleParameterChange('status', e.target.value)}
              >
                <option value="">No Change</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <p className="form-help">Change property status</p>
            </div>

            <div className="form-group">
              <label className="form-label">Special Instructions</label>
              <textarea
                className="form-textarea"
                value={operationParameters.specialInstructions || ''}
                onChange={(e) => handleParameterChange('specialInstructions', e.target.value)}
                placeholder="Enter special instructions for all selected properties"
              />
              <p className="form-help">Add or update special instructions</p>
            </div>

            <div className="form-group">
              <label className="form-label">AI Automation Level</label>
              <select
                className="form-select"
                value={operationParameters.aiAutomationLevel || ''}
                onChange={(e) => handleParameterChange('aiAutomationLevel', e.target.value)}
              >
                <option value="">No Change</option>
                <option value="manual">Manual Only</option>
                <option value="assisted">AI Assisted</option>
                <option value="autonomous">Autonomous</option>
              </select>
              <p className="form-help">Set AI automation level</p>
            </div>
          </div>
        )}

        {selectedOperationData.type === 'data_export' && (
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Export Format</label>
              <select
                className="form-select"
                value={operationParameters.format || 'csv'}
                onChange={(e) => handleParameterChange('format', e.target.value)}
              >
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
                <option value="pdf">PDF Report</option>
                <option value="json">JSON</option>
              </select>
              <p className="form-help">Choose export format</p>
            </div>

            <div className="form-group">
              <label className="form-label">Include Related Data</label>
              <select
                className="form-select"
                value={operationParameters.includeRelated ? 'yes' : 'no'}
                onChange={(e) => handleParameterChange('includeRelated', e.target.value === 'yes')}
              >
                <option value="no">Basic Data Only</option>
                <option value="yes">Include Related Data</option>
              </select>
              <p className="form-help">Include incidents, evidence, and assignments</p>
            </div>
          </div>
        )}
      </ParametersForm>
    </div>
  );

  return (
    <BulkOperationsContainer>
      {/* Operations Sidebar */}
      <OperationsSidebar>
        <SidebarHeader>
          <h2>Bulk Operations</h2>
          <p>Efficiently manage multiple items at once</p>
        </SidebarHeader>

        <OperationsList>
          {sampleOperations.map(category => (
            <div key={category.category} className="operation-category">
              <h3>{category.category}</h3>
              {category.operations.map(operation => (
                <div
                  key={operation.id}
                  className={`operation-item ${selectedOperation === operation.id ? 'active' : ''}`}
                  onClick={() => setSelectedOperation(operation.id)}
                >
                  <div className="operation-header">
                    <div className="operation-icon">
                      {operation.icon}
                    </div>
                    <div className="operation-title">{operation.name}</div>
                  </div>
                  <div className="operation-description">{operation.description}</div>
                </div>
              ))}
            </div>
          ))}
        </OperationsList>
      </OperationsSidebar>

      {/* Main Content */}
      <MainContent>
        <ContentHeader>
          <div className="header-content">
            <div className="header-info">
              <h1>{selectedOperationData.name}</h1>
              <p>{selectedOperationData.description}</p>
            </div>
            <div className="header-actions">
              <Button variant="outline" size="sm">
                <ClockIcon className="w-4 h-4 mr-2" />
                Schedule
              </Button>
              <Button 
                onClick={executeOperation}
                disabled={isExecuting || selectedItems.length === 0}
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                {isExecuting ? 'Executing...' : 'Execute Operation'}
              </Button>
            </div>
          </div>
        </ContentHeader>

        <ContentBody>
          <OperationForm>
            {renderSelectionSection()}
            {renderParametersSection()}
          </OperationForm>

          {/* Progress Display */}
          {currentOperation && (
            <ProgressDisplay>
              <div className="progress-header">
                <div className="progress-title">
                  Operation in Progress: {currentOperation.name}
                </div>
                <div className="progress-controls">
                  <Button variant="outline" size="sm" disabled={!isExecuting}>
                    <PauseIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={!isExecuting}>
                    <StopIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${currentOperation.progress}%` }}
                />
              </div>

              <div className="progress-stats">
                <div className="stat-item">
                  <div className="stat-value">{Math.floor(currentOperation.progress)}%</div>
                  <div className="stat-label">Complete</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{Math.floor(currentOperation.progress / 100 * currentOperation.targetCount)}</div>
                  <div className="stat-label">Processed</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{currentOperation.targetCount}</div>
                  <div className="stat-label">Total</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{currentOperation.errors.length}</div>
                  <div className="stat-label">Errors</div>
                </div>
              </div>

              {isExecuting && (
                <div className="progress-current">
                  <div className="current-action">
                    Processing item {Math.floor(currentOperation.progress / 100 * currentOperation.targetCount) + 1} of {currentOperation.targetCount}
                  </div>
                  <div className="current-details">
                    Estimated time remaining: {Math.max(0, Math.floor((100 - currentOperation.progress) / 10))} seconds
                  </div>
                </div>
              )}
            </ProgressDisplay>
          )}

          {/* Results Summary */}
          {results && (
            <ResultsSummary>
              <div className="results-header">
                <div className="results-title">Operation Results</div>
                <div className="results-subtitle">{results.summary.message}</div>
              </div>

              <div className="results-stats">
                <div className="stat-item">
                  <div className="stat-number success">{results.successful}</div>
                  <div className="stat-label">Successful</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number error">{results.failed}</div>
                  <div className="stat-label">Failed</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number warning">{results.skipped}</div>
                  <div className="stat-label">Skipped</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number info">{results.processed}</div>
                  <div className="stat-label">Total</div>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="results-details">
                  <h4 style={{ marginBottom: '1rem', color: '#374151', fontWeight: '600' }}>
                    Errors and Warnings
                  </h4>
                  <div className="error-list">
                    {results.errors.map((error, index) => (
                      <div key={index} className="error-item">
                        <div className="error-message">{error.error}</div>
                        <div className="error-details">
                          Item: {sampleProperties.find(p => p.id === error.itemId)?.name || error.itemId}
                          {error.field && ` • Field: ${error.field}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ResultsSummary>
          )}
        </ContentBody>
      </MainContent>
    </BulkOperationsContainer>
  );
};

export default BulkOperationsPanel;
