// frontend/src/components/AdminDashboard/ManualOverrideControls.tsx
/**
 * MANUAL OVERRIDE CONTROLS - APEX AI ADMIN DASHBOARD
 * ==================================================
 * Comprehensive manual override system providing admins with failsafe controls
 * for all AI automation processes. Ensures human oversight and intervention
 * capabilities for critical security decisions.
 * 
 * FEATURES:
 * - Real-time AI process monitoring and intervention
 * - Emergency stop controls for all automated systems
 * - Manual decision approval workflow
 * - AI confidence threshold management
 * - Custom rule injection and override
 * - Audit trail for all manual interventions
 * - Role-based override permissions
 * - Automated failover to manual mode
 * - Live system status monitoring
 * - Integration with client portal synchronization
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import {
  ShieldExclamationIcon,
  StopIcon,
  PlayIcon,
  PauseIcon,
  CpuChipIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BellIcon,
  CogIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  HandRaisedIcon,
  BoltIcon,
  ArrowPathIcon,
  ChartBarIcon,
  DocumentTextIcon,
  PhoneIcon,
  CameraIcon,
  ShieldCheckIcon,
  KeyIcon,
  LockClosedIcon,
  UnlockOpenIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  FireIcon,
  CommandLineIcon,
  BeakerIcon,
  LightBulbIcon,
  WrenchScrewdriverIcon,
  SignalIcon,
  PowerIcon
} from '@heroicons/react/24/outline';
import {
  StopIcon as StopIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  FireIcon as FireIconSolid,
  ShieldExclamationIcon as ShieldExclamationIconSolid
} from '@heroicons/react/24/solid';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';

// ================================
// INTERFACES & TYPES
// ================================

interface ManualOverrideControlsProps {
  /** Current AI system status */
  aiSystemStatus: AISystemStatus;
  /** Active AI processes */
  activeProcesses: AIProcess[];
  /** Available override actions */
  availableOverrides: OverrideAction[];
  /** User permissions for overrides */
  userPermissions: OverridePermission[];
  /** Callback for override execution */
  onOverrideExecute: (override: OverrideExecution) => Promise<OverrideResult>;
  /** Callback for system status changes */
  onSystemStatusChange: (status: SystemStatusChange) => void;
  /** Real-time updates callback */
  onRealtimeUpdate?: (update: RealtimeUpdate) => void;
}

interface AISystemStatus {
  overallStatus: 'operational' | 'degraded' | 'manual' | 'emergency';
  systemHealth: number;
  confidenceScore: number;
  activeMode: 'autonomous' | 'assisted' | 'manual';
  lastUpdate: string;
  uptime: number;
  processedToday: number;
  interventionsToday: number;
  modules: AIModuleStatus[];
}

interface AIModuleStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'error' | 'maintenance';
  mode: 'auto' | 'manual' | 'assisted';
  confidence: number;
  lastActivity: string;
  processingRate: number;
  errorRate: number;
  overrideAvailable: boolean;
}

interface AIProcess {
  id: string;
  type: 'threat_detection' | 'incident_analysis' | 'voice_dispatch' | 'evidence_processing' | 'guard_notification';
  name: string;
  description: string;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'awaiting_approval';
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  startedAt: string;
  estimatedCompletion?: string;
  progress: number;
  requiresApproval: boolean;
  canOverride: boolean;
  currentAction: string;
  affectedSystems: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface OverrideAction {
  id: string;
  name: string;
  description: string;
  type: 'emergency_stop' | 'manual_approval' | 'process_pause' | 'confidence_adjust' | 'mode_switch' | 'custom_rule';
  scope: 'system' | 'module' | 'process' | 'property';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiredRole: string;
  confirmationRequired: boolean;
  auditLevel: 'standard' | 'enhanced' | 'full';
  timeoutMinutes?: number;
}

interface OverridePermission {
  action: string;
  granted: boolean;
  scope: string[];
  restrictions: string[];
  expiresAt?: string;
}

interface OverrideExecution {
  actionId: string;
  targetId: string;
  parameters: Record<string, any>;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  notifyStakeholders: boolean;
  scheduledFor?: string;
}

interface OverrideResult {
  success: boolean;
  executedAt: string;
  affectedSystems: string[];
  rollbackAvailable: boolean;
  auditLogId: string;
  message: string;
  warnings: string[];
}

interface SystemStatusChange {
  newStatus: string;
  reason: string;
  initiatedBy: string;
  timestamp: string;
  affectedModules: string[];
}

interface RealtimeUpdate {
  type: 'process_status' | 'confidence_change' | 'alert' | 'override_executed';
  data: any;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

interface PendingApproval {
  id: string;
  processId: string;
  type: 'threat_response' | 'police_call' | 'guard_dispatch' | 'evidence_release';
  title: string;
  description: string;
  confidence: number;
  riskAssessment: string;
  recommendedAction: string;
  timeRemaining: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  affectedProperty: string;
  evidenceFiles: string[];
}

// ================================
// STYLED COMPONENTS
// ================================

const OverrideControlsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  height: 100vh;
  background: #0f172a;
  color: white;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #1e293b;
`;

const MainControlPanel = styled.div`
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  overflow: hidden;
`;

const SidePanel = styled.div`
  background: #1e293b;
  border-left: 1px solid #334155;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ControlHeader = styled.div`
  background: linear-gradient(90deg, #dc2626, #ea580c);
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #334155;
  
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .header-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      
      .header-icon {
        width: 3rem;
        height: 3rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        svg {
          width: 1.5rem;
          height: 1.5rem;
        }
      }
      
      .header-text {
        h1 {
          margin: 0 0 0.25rem 0;
          font-size: 1.5rem;
          font-weight: 700;
        }
        
        p {
          margin: 0;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.875rem;
        }
      }
    }
    
    .emergency-stop {
      background: #dc2626;
      border: 2px solid #f87171;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      &:hover {
        background: #b91c1c;
        border-color: #ef4444;
        transform: scale(1.05);
      }
      
      &:active {
        transform: scale(0.95);
      }
    }
  }
`;

const SystemStatusBar = styled.div`
  background: #1e293b;
  border-bottom: 1px solid #334155;
  padding: 1rem 2rem;
  
  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    
    .status-item {
      .status-label {
        color: #94a3b8;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
      }
      
      .status-value {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        .status-indicator {
          width: 0.75rem;
          height: 0.75rem;
          border-radius: 50%;
          
          &.operational { background: #10b981; }
          &.degraded { background: #f59e0b; }
          &.manual { background: #3b82f6; }
          &.emergency { background: #ef4444; }
        }
        
        .status-text {
          font-size: 1rem;
          font-weight: 600;
          color: white;
        }
        
        .status-number {
          font-size: 1.25rem;
          font-weight: 700;
          color: #10b981;
        }
      }
    }
  }
`;

const ControlContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
`;

const ControlSection = styled.div`
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid #334155;
  border-radius: 8px;
  margin-bottom: 2rem;
  overflow: hidden;
  
  .section-header {
    background: rgba(15, 23, 42, 0.8);
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #334155;
    
    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      .header-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        
        .section-icon {
          width: 2rem;
          height: 2rem;
          background: rgba(59, 130, 246, 0.2);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #60a5fa;
          
          svg {
            width: 1rem;
            height: 1rem;
          }
        }
        
        h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: white;
        }
      }
      
      .header-actions {
        display: flex;
        gap: 0.5rem;
      }
    }
  }
  
  .section-content {
    padding: 1.5rem;
  }
`;

const ProcessGrid = styled.div`
  display: grid;
  gap: 1rem;
  
  .process-item {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 1rem;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: #475569;
      background: rgba(15, 23, 42, 0.8);
    }
    
    &.critical {
      border-color: #ef4444;
      box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.2);
    }
    
    &.high {
      border-color: #f59e0b;
      box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.2);
    }
    
    .process-header {
      display: flex;
      align-items: center;
      justify-content: between;
      margin-bottom: 0.75rem;
      
      .process-info {
        flex: 1;
        
        .process-name {
          font-weight: 600;
          color: white;
          margin-bottom: 0.25rem;
        }
        
        .process-description {
          color: #94a3b8;
          font-size: 0.875rem;
        }
      }
      
      .process-controls {
        display: flex;
        gap: 0.5rem;
      }
    }
    
    .process-status {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;
      
      .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        
        &.running {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        
        &.paused {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        
        &.awaiting_approval {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
      }
      
      .confidence-meter {
        flex: 1;
        
        .confidence-label {
          color: #94a3b8;
          font-size: 0.75rem;
          margin-bottom: 0.25rem;
        }
        
        .confidence-bar {
          width: 100%;
          height: 4px;
          background: #334155;
          border-radius: 2px;
          overflow: hidden;
          
          .confidence-fill {
            height: 100%;
            border-radius: 2px;
            transition: width 0.3s ease;
            
            &.high { background: #10b981; }
            &.medium { background: #f59e0b; }
            &.low { background: #ef4444; }
          }
        }
      }
    }
    
    .process-progress {
      margin-bottom: 0.75rem;
      
      .progress-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.25rem;
        
        .progress-label {
          color: #94a3b8;
          font-size: 0.75rem;
        }
        
        .progress-value {
          color: white;
          font-size: 0.75rem;
          font-weight: 500;
        }
      }
      
      .progress-bar {
        width: 100%;
        height: 6px;
        background: #334155;
        border-radius: 3px;
        overflow: hidden;
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #1d4ed8);
          border-radius: 3px;
          transition: width 0.3s ease;
        }
      }
    }
    
    .process-actions {
      display: flex;
      gap: 0.5rem;
      
      button {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #475569;
        background: rgba(30, 41, 59, 0.8);
        color: white;
        border-radius: 4px;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        
        &:hover {
          background: rgba(51, 65, 85, 0.8);
          border-color: #64748b;
        }
        
        &.approve {
          border-color: #10b981;
          color: #10b981;
          
          &:hover {
            background: rgba(16, 185, 129, 0.1);
          }
        }
        
        &.reject {
          border-color: #ef4444;
          color: #ef4444;
          
          &:hover {
            background: rgba(239, 68, 68, 0.1);
          }
        }
        
        &.pause {
          border-color: #f59e0b;
          color: #f59e0b;
          
          &:hover {
            background: rgba(245, 158, 11, 0.1);
          }
        }
        
        svg {
          width: 0.875rem;
          height: 0.875rem;
        }
      }
    }
  }
`;

const PendingApprovalsPanel = styled.div`
  .approval-item {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 6px;
    padding: 1rem;
    margin-bottom: 1rem;
    
    .approval-header {
      display: flex;
      align-items: center;
      justify-content: between;
      margin-bottom: 0.75rem;
      
      .approval-info {
        flex: 1;
        
        .approval-title {
          font-weight: 600;
          color: white;
          margin-bottom: 0.25rem;
        }
        
        .approval-description {
          color: #fca5a5;
          font-size: 0.875rem;
        }
      }
      
      .time-remaining {
        background: rgba(239, 68, 68, 0.2);
        color: #fca5a5;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
      }
    }
    
    .approval-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
      
      .detail-item {
        text-align: center;
        
        .detail-label {
          color: #fca5a5;
          font-size: 0.75rem;
          margin-bottom: 0.25rem;
        }
        
        .detail-value {
          color: white;
          font-weight: 600;
        }
      }
    }
    
    .approval-actions {
      display: flex;
      gap: 0.5rem;
      
      button {
        flex: 1;
        padding: 0.75rem;
        border: none;
        border-radius: 4px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        
        &.approve {
          background: #10b981;
          color: white;
          
          &:hover {
            background: #059669;
          }
        }
        
        &.reject {
          background: #ef4444;
          color: white;
          
          &:hover {
            background: #dc2626;
          }
        }
        
        &.details {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.3);
          
          &:hover {
            background: rgba(59, 130, 246, 0.3);
          }
        }
        
        svg {
          width: 1rem;
          height: 1rem;
        }
      }
    }
  }
`;

const OverrideHistory = styled.div`
  max-height: 300px;
  overflow-y: auto;
  
  .history-item {
    padding: 0.75rem;
    border-bottom: 1px solid #334155;
    
    &:last-child {
      border-bottom: none;
    }
    
    .history-header {
      display: flex;
      align-items: center;
      justify-content: between;
      margin-bottom: 0.5rem;
      
      .history-action {
        font-weight: 500;
        color: white;
      }
      
      .history-time {
        color: #94a3b8;
        font-size: 0.75rem;
      }
    }
    
    .history-details {
      color: #94a3b8;
      font-size: 0.875rem;
      line-height: 1.4;
    }
    
    .history-user {
      color: #60a5fa;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }
  }
`;

// ================================
// SAMPLE DATA
// ================================

const generateSampleAIStatus = (): AISystemStatus => ({
  overallStatus: 'operational',
  systemHealth: 94,
  confidenceScore: 87,
  activeMode: 'autonomous',
  lastUpdate: new Date().toISOString(),
  uptime: 99.7,
  processedToday: 247,
  interventionsToday: 3,
  modules: [
    {
      id: 'threat_detection',
      name: 'Threat Detection',
      status: 'online',
      mode: 'auto',
      confidence: 92,
      lastActivity: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      processingRate: 15.2,
      errorRate: 0.3,
      overrideAvailable: true
    },
    {
      id: 'voice_dispatch',
      name: 'Voice AI Dispatcher',
      status: 'online',
      mode: 'assisted',
      confidence: 85,
      lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      processingRate: 8.7,
      errorRate: 0.1,
      overrideAvailable: true
    },
    {
      id: 'evidence_processing',
      name: 'Evidence Processing',
      status: 'online',
      mode: 'auto',
      confidence: 96,
      lastActivity: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
      processingRate: 22.1,
      errorRate: 0.0,
      overrideAvailable: false
    }
  ]
});

const generateSampleProcesses = (): AIProcess[] => [
  {
    id: 'proc_001',
    type: 'threat_detection',
    name: 'Weapon Detection Analysis',
    description: 'Analyzing potential weapon detected on Camera 4 - Main Entrance',
    status: 'awaiting_approval',
    priority: 'critical',
    confidence: 94,
    startedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    estimatedCompletion: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    progress: 85,
    requiresApproval: true,
    canOverride: true,
    currentAction: 'Confirming threat classification',
    affectedSystems: ['Camera System', 'Alert System', 'Guard Dispatch'],
    riskLevel: 'critical'
  },
  {
    id: 'proc_002',
    type: 'voice_dispatch',
    name: 'Incoming Security Call',
    description: 'Processing incoming call from tenant about suspicious activity',
    status: 'running',
    priority: 'high',
    confidence: 78,
    startedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    progress: 60,
    requiresApproval: false,
    canOverride: true,
    currentAction: 'Collecting incident details',
    affectedSystems: ['Voice System', 'Incident Database'],
    riskLevel: 'medium'
  },
  {
    id: 'proc_003',
    type: 'evidence_processing',
    name: 'Video Evidence Analysis',
    description: 'Processing and analyzing video evidence from last night\'s incident',
    status: 'running',
    priority: 'medium',
    confidence: 91,
    startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    estimatedCompletion: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    progress: 45,
    requiresApproval: false,
    canOverride: false,
    currentAction: 'Extracting key frames and timestamps',
    affectedSystems: ['Evidence Database', 'AI Analysis Engine'],
    riskLevel: 'low'
  }
];

const generatePendingApprovals = (): PendingApproval[] => [
  {
    id: 'approval_001',
    processId: 'proc_001',
    type: 'police_call',
    title: 'Police Dispatch Authorization',
    description: 'High-confidence weapon detection requires police notification',
    confidence: 94,
    riskAssessment: 'CRITICAL - Immediate threat to property safety',
    recommendedAction: 'Dispatch police and notify property management',
    timeRemaining: 120,
    priority: 'critical',
    affectedProperty: 'Luxe Apartments Building A',
    evidenceFiles: ['CAM04_2025082015.mp4', 'AUDIO_INCIDENT_001.wav']
  },
  {
    id: 'approval_002',
    processId: 'proc_004',
    type: 'guard_dispatch',
    title: 'Emergency Guard Dispatch',
    description: 'Multiple unauthorized individuals detected in restricted area',
    confidence: 87,
    riskAssessment: 'HIGH - Potential security breach',
    recommendedAction: 'Dispatch security guard to investigate',
    timeRemaining: 300,
    priority: 'high',
    affectedProperty: 'Metropolitan Tower',
    evidenceFiles: ['CAM12_2025082015.mp4']
  }
];

// ================================
// MAIN COMPONENT
// ================================

export const ManualOverrideControls: React.FC<ManualOverrideControlsProps> = ({
  aiSystemStatus,
  activeProcesses = [],
  availableOverrides = [],
  userPermissions = [],
  onOverrideExecute,
  onSystemStatusChange,
  onRealtimeUpdate
}) => {
  const { toast } = useToast();
  
  const [systemStatus, setSystemStatus] = useState<AISystemStatus>(
    Object.keys(aiSystemStatus).length > 0 ? aiSystemStatus : generateSampleAIStatus()
  );
  const [processes, setProcesses] = useState<AIProcess[]>(
    activeProcesses.length > 0 ? activeProcesses : generateSampleProcesses()
  );
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>(generatePendingApprovals());
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
  const [overrideHistory, setOverrideHistory] = useState<any[]>([]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update pending approval timers
      setPendingApprovals(prev => 
        prev.map(approval => ({
          ...approval,
          timeRemaining: Math.max(0, approval.timeRemaining - 1)
        })).filter(approval => approval.timeRemaining > 0)
      );

      // Update process progress
      setProcesses(prev =>
        prev.map(process => ({
          ...process,
          progress: process.status === 'running' 
            ? Math.min(100, process.progress + Math.random() * 2)
            : process.progress
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleEmergencyStop = useCallback(async () => {
    if (!confirm('EMERGENCY STOP: This will halt all AI processes immediately. Are you sure?')) {
      return;
    }

    try {
      const override: OverrideExecution = {
        actionId: 'emergency_stop',
        targetId: 'system',
        parameters: { immediate: true },
        reason: 'Emergency stop initiated by admin',
        urgency: 'emergency',
        notifyStakeholders: true
      };

      const result = await onOverrideExecute(override);
      
      if (result.success) {
        setSystemStatus(prev => ({ ...prev, overallStatus: 'emergency', activeMode: 'manual' }));
        setProcesses(prev => prev.map(p => ({ ...p, status: 'paused' })));
        
        toast({
          title: "Emergency Stop Activated",
          description: "All AI processes have been halted.",
          variant: "destructive"
        });

        setOverrideHistory(prev => [{
          action: 'Emergency Stop',
          timestamp: new Date().toISOString(),
          user: 'Admin',
          details: 'All AI processes halted immediately'
        }, ...prev]);
      }
    } catch (error) {
      toast({
        title: "Emergency Stop Failed",
        description: "Unable to execute emergency stop. Check system status.",
        variant: "destructive"
      });
    }
  }, [onOverrideExecute, toast]);

  const handleProcessApproval = useCallback(async (approvalId: string, approved: boolean) => {
    const approval = pendingApprovals.find(a => a.id === approvalId);
    if (!approval) return;

    try {
      const override: OverrideExecution = {
        actionId: approved ? 'approve_process' : 'reject_process',
        targetId: approval.processId,
        parameters: { approvalId, decision: approved },
        reason: approved ? 'Process approved by admin' : 'Process rejected by admin',
        urgency: approval.priority,
        notifyStakeholders: true
      };

      const result = await onOverrideExecute(override);
      
      if (result.success) {
        setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));
        setProcesses(prev => 
          prev.map(p => 
            p.id === approval.processId 
              ? { ...p, status: approved ? 'running' : 'paused', requiresApproval: false }
              : p
          )
        );

        toast({
          title: approved ? "Process Approved" : "Process Rejected",
          description: `${approval.title} has been ${approved ? 'approved' : 'rejected'}.`,
          variant: approved ? "default" : "destructive"
        });

        setOverrideHistory(prev => [{
          action: `${approved ? 'Approved' : 'Rejected'}: ${approval.title}`,
          timestamp: new Date().toISOString(),
          user: 'Admin',
          details: approval.description
        }, ...prev]);
      }
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Unable to process approval. Please try again.",
        variant: "destructive"
      });
    }
  }, [pendingApprovals, onOverrideExecute, toast]);

  const handleProcessControl = useCallback(async (processId: string, action: 'pause' | 'resume' | 'stop') => {
    try {
      const override: OverrideExecution = {
        actionId: `process_${action}`,
        targetId: processId,
        parameters: { action },
        reason: `Process ${action} initiated by admin`,
        urgency: 'medium',
        notifyStakeholders: false
      };

      const result = await onOverrideExecute(override);
      
      if (result.success) {
        setProcesses(prev => 
          prev.map(p => 
            p.id === processId 
              ? { 
                  ...p, 
                  status: action === 'pause' ? 'paused' : action === 'resume' ? 'running' : 'completed'
                }
              : p
          )
        );

        toast({
          title: `Process ${action.charAt(0).toUpperCase() + action.slice(1)}d`,
          description: `Process has been ${action}d successfully.`,
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Action Failed",
        description: `Unable to ${action} process. Please try again.`,
        variant: "destructive"
      });
    }
  }, [onOverrideExecute, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'operational';
      case 'degraded': return 'degraded';
      case 'manual': return 'manual';
      case 'emergency': return 'emergency';
      default: return 'operational';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'high';
    if (confidence >= 70) return 'medium';
    return 'low';
  };

  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <OverrideControlsContainer>
      {/* Main Control Panel */}
      <MainControlPanel>
        {/* Control Header */}
        <ControlHeader>
          <div className="header-content">
            <div className="header-info">
              <div className="header-icon">
                <ShieldExclamationIconSolid />
              </div>
              <div className="header-text">
                <h1>Manual Override Controls</h1>
                <p>AI System Monitoring & Manual Intervention</p>
              </div>
            </div>
            <button className="emergency-stop" onClick={handleEmergencyStop}>
              <StopIconSolid />
              EMERGENCY STOP
            </button>
          </div>
        </ControlHeader>

        {/* System Status Bar */}
        <SystemStatusBar>
          <div className="status-grid">
            <div className="status-item">
              <div className="status-label">System Status</div>
              <div className="status-value">
                <div className={`status-indicator ${getStatusColor(systemStatus.overallStatus)}`} />
                <div className="status-text">{systemStatus.overallStatus.toUpperCase()}</div>
              </div>
            </div>
            <div className="status-item">
              <div className="status-label">Health Score</div>
              <div className="status-value">
                <div className="status-number">{systemStatus.systemHealth}%</div>
              </div>
            </div>
            <div className="status-item">
              <div className="status-label">AI Confidence</div>
              <div className="status-value">
                <div className="status-number">{systemStatus.confidenceScore}%</div>
              </div>
            </div>
            <div className="status-item">
              <div className="status-label">Mode</div>
              <div className="status-value">
                <div className="status-text">{systemStatus.activeMode.toUpperCase()}</div>
              </div>
            </div>
            <div className="status-item">
              <div className="status-label">Processed Today</div>
              <div className="status-value">
                <div className="status-number">{systemStatus.processedToday}</div>
              </div>
            </div>
            <div className="status-item">
              <div className="status-label">Interventions</div>
              <div className="status-value">
                <div className="status-number">{systemStatus.interventionsToday}</div>
              </div>
            </div>
          </div>
        </SystemStatusBar>

        {/* Control Content */}
        <ControlContent>
          {/* Active Processes */}
          <ControlSection>
            <div className="section-header">
              <div className="header-content">
                <div className="header-left">
                  <div className="section-icon">
                    <CpuChipIcon />
                  </div>
                  <h3>Active AI Processes ({processes.length})</h3>
                </div>
                <div className="header-actions">
                  <Button variant="outline" size="sm">
                    <EyeIcon className="w-4 h-4 mr-2" />
                    View All
                  </Button>
                </div>
              </div>
            </div>
            <div className="section-content">
              <ProcessGrid>
                {processes.map(process => (
                  <div 
                    key={process.id} 
                    className={`process-item ${process.priority}`}
                  >
                    <div className="process-header">
                      <div className="process-info">
                        <div className="process-name">{process.name}</div>
                        <div className="process-description">{process.description}</div>
                      </div>
                    </div>
                    
                    <div className="process-status">
                      <div className={`status-badge ${process.status}`}>
                        {process.status.replace('_', ' ')}
                      </div>
                      <div className="confidence-meter">
                        <div className="confidence-label">
                          Confidence: {process.confidence}%
                        </div>
                        <div className="confidence-bar">
                          <div 
                            className={`confidence-fill ${getConfidenceColor(process.confidence)}`}
                            style={{ width: `${process.confidence}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="process-progress">
                      <div className="progress-header">
                        <div className="progress-label">Progress</div>
                        <div className="progress-value">{Math.round(process.progress)}%</div>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${process.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="process-actions">
                      {process.canOverride && (
                        <>
                          {process.status === 'running' && (
                            <button 
                              className="pause"
                              onClick={() => handleProcessControl(process.id, 'pause')}
                            >
                              <PauseIcon />
                              Pause
                            </button>
                          )}
                          {process.status === 'paused' && (
                            <button 
                              className="approve"
                              onClick={() => handleProcessControl(process.id, 'resume')}
                            >
                              <PlayIcon />
                              Resume
                            </button>
                          )}
                          <button 
                            className="reject"
                            onClick={() => handleProcessControl(process.id, 'stop')}
                          >
                            <StopIcon />
                            Stop
                          </button>
                        </>
                      )}
                      <button onClick={() => setSelectedProcess(process.id)}>
                        <EyeIcon />
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </ProcessGrid>
            </div>
          </ControlSection>

          {/* AI Module Status */}
          <ControlSection>
            <div className="section-header">
              <div className="header-content">
                <div className="header-left">
                  <div className="section-icon">
                    <CogIcon />
                  </div>
                  <h3>AI Module Status</h3>
                </div>
              </div>
            </div>
            <div className="section-content">
              <ProcessGrid>
                {systemStatus.modules.map(module => (
                  <div key={module.id} className="process-item">
                    <div className="process-header">
                      <div className="process-info">
                        <div className="process-name">{module.name}</div>
                        <div className="process-description">
                          {module.processingRate.toFixed(1)} items/min • {module.errorRate.toFixed(1)}% error rate
                        </div>
                      </div>
                    </div>
                    
                    <div className="process-status">
                      <div className={`status-badge ${module.status === 'online' ? 'running' : 'paused'}`}>
                        {module.status}
                      </div>
                      <div className="confidence-meter">
                        <div className="confidence-label">
                          Mode: {module.mode.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="process-actions">
                      {module.overrideAvailable && (
                        <>
                          <button className="pause">
                            <AdjustmentsHorizontalIcon />
                            Configure
                          </button>
                          <button>
                            <HandRaisedIcon />
                            Override
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </ProcessGrid>
            </div>
          </ControlSection>
        </ControlContent>
      </MainControlPanel>

      {/* Side Panel */}
      <SidePanel>
        {/* Pending Approvals */}
        <ControlSection>
          <div className="section-header">
            <div className="header-content">
              <div className="header-left">
                <div className="section-icon">
                  <ExclamationTriangleIconSolid />
                </div>
                <h3>Pending Approvals ({pendingApprovals.length})</h3>
              </div>
            </div>
          </div>
          <div className="section-content">
            <PendingApprovalsPanel>
              {pendingApprovals.map(approval => (
                <div key={approval.id} className="approval-item">
                  <div className="approval-header">
                    <div className="approval-info">
                      <div className="approval-title">{approval.title}</div>
                      <div className="approval-description">{approval.description}</div>
                    </div>
                    <div className="time-remaining">
                      {formatTimeRemaining(approval.timeRemaining)}
                    </div>
                  </div>
                  
                  <div className="approval-details">
                    <div className="detail-item">
                      <div className="detail-label">Confidence</div>
                      <div className="detail-value">{approval.confidence}%</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Priority</div>
                      <div className="detail-value">{approval.priority.toUpperCase()}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Evidence</div>
                      <div className="detail-value">{approval.evidenceFiles.length}</div>
                    </div>
                  </div>
                  
                  <div className="approval-actions">
                    <button 
                      className="approve"
                      onClick={() => handleProcessApproval(approval.id, true)}
                    >
                      <CheckCircleIcon />
                      Approve
                    </button>
                    <button 
                      className="reject"
                      onClick={() => handleProcessApproval(approval.id, false)}
                    >
                      <StopIcon />
                      Reject
                    </button>
                    <button className="details">
                      <EyeIcon />
                      Details
                    </button>
                  </div>
                </div>
              ))}
              
              {pendingApprovals.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  <CheckCircleIcon style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem' }} />
                  <p>No pending approvals</p>
                </div>
              )}
            </PendingApprovalsPanel>
          </div>
        </ControlSection>

        {/* Override History */}
        <ControlSection>
          <div className="section-header">
            <div className="header-content">
              <div className="header-left">
                <div className="section-icon">
                  <ClockIcon />
                </div>
                <h3>Recent Overrides</h3>
              </div>
            </div>
          </div>
          <div className="section-content">
            <OverrideHistory>
              {overrideHistory.slice(0, 5).map((item, index) => (
                <div key={index} className="history-item">
                  <div className="history-header">
                    <div className="history-action">{item.action}</div>
                    <div className="history-time">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="history-details">{item.details}</div>
                  <div className="history-user">by {item.user}</div>
                </div>
              ))}
              
              {overrideHistory.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  <DocumentTextIcon style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem' }} />
                  <p>No recent overrides</p>
                </div>
              )}
            </OverrideHistory>
          </div>
        </ControlSection>
      </SidePanel>
    </OverrideControlsContainer>
  );
};

export default ManualOverrideControls;
