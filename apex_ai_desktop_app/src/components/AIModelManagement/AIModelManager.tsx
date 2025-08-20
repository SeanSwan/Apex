// apex_ai_desktop_app/src/components/AIModelManagement/AIModelManager.tsx
/**
 * APEX AI MODEL MANAGER COMPONENT
 * ===============================
 * Professional interface for managing AI models deployment and monitoring
 * Used for deploying, monitoring, and managing AI/ML models across the platform
 * 
 * Features:
 * - Model deployment and version management
 * - Real-time performance metrics monitoring
 * - Model switching and rollback capabilities
 * - Training data management and annotation
 * - Hardware utilization monitoring
 * - Model confidence and accuracy tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import './AIModelManager.css';

// ===========================
// TYPES & INTERFACES
// ===========================

interface AIModel {
  id: string;
  name: string;
  type: 'vision' | 'language' | 'voice' | 'hybrid';
  version: string;
  status: 'active' | 'inactive' | 'deploying' | 'training' | 'failed' | 'archived';
  deploymentDate: string;
  lastUpdated: string;
  accuracy: number;
  confidence: number;
  hardwareRequirements: {
    gpuMemory: string;
    cpuCores: number;
    ramGB: number;
    storageGB: number;
  };
  performanceMetrics: {
    inferenceTime: number; // milliseconds
    throughput: number; // requests per second
    uptime: number; // percentage
    errorRate: number; // percentage
  };
  trainingData: {
    totalSamples: number;
    lastAnnotated: string;
    annotationProgress: number; // percentage
  };
  description: string;
  tags: string[];
  environment: 'development' | 'staging' | 'production';
  modelFile: string;
  configFile: string;
  createdBy: string;
  notes: string;
}

interface ModelDeployment {
  modelId: string;
  targetEnvironment: 'development' | 'staging' | 'production';
  rollbackPlan: boolean;
  healthChecks: boolean;
  autoScale: boolean;
  maxInstances: number;
}

interface PerformanceAlert {
  id: string;
  modelId: string;
  alertType: 'accuracy_drop' | 'high_latency' | 'error_spike' | 'hardware_limit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

// ===========================
// MAIN COMPONENT
// ===========================

const AIModelManager: React.FC<{
  userRole: string;
  userId: string;
  onClose?: () => void;
}> = ({ userRole, userId, onClose }) => {
  // ===========================
  // STATE MANAGEMENT
  // ===========================
  
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'deploy' | 'monitor' | 'training'>('overview');
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [deploymentForm, setDeploymentForm] = useState<ModelDeployment>({
    modelId: '',
    targetEnvironment: 'development',
    rollbackPlan: true,
    healthChecks: true,
    autoScale: false,
    maxInstances: 3
  });

  // Hardware monitoring state
  const [hardwareStats, setHardwareStats] = useState({
    gpuUtilization: 0,
    cpuUtilization: 0,
    memoryUsage: 0,
    diskUsage: 0,
    temperature: 0
  });

  // Real-time metrics
  const [realtimeMetrics, setRealtimeMetrics] = useState({
    activeInferences: 0,
    queuedRequests: 0,
    averageResponseTime: 0,
    successRate: 0
  });

  // ===========================
  // LIFECYCLE & DATA LOADING
  // ===========================

  useEffect(() => {
    loadModels();
    loadAlerts();
    
    // Set up real-time monitoring
    const metricsInterval = setInterval(() => {
      loadRealtimeMetrics();
      loadHardwareStats();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(metricsInterval);
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/internal/v1/ai-models', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setModels(data.models || []);
        
        // Select first active model by default
        const activeModel = data.models?.find((m: AIModel) => m.status === 'active');
        if (activeModel) {
          setSelectedModel(activeModel);
        }
      }
    } catch (error) {
      console.error('Error loading AI models:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/internal/v1/ai-models/alerts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const loadRealtimeMetrics = async () => {
    try {
      const response = await fetch('/api/internal/v1/ai-models/metrics/realtime', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRealtimeMetrics(data.metrics || realtimeMetrics);
      }
    } catch (error) {
      console.error('Error loading realtime metrics:', error);
    }
  };

  const loadHardwareStats = async () => {
    try {
      const response = await fetch('/api/internal/v1/ai-models/hardware/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHardwareStats(data.stats || hardwareStats);
      }
    } catch (error) {
      console.error('Error loading hardware stats:', error);
    }
  };

  // ===========================
  // MODEL OPERATIONS
  // ===========================

  const deployModel = async () => {
    if (!selectedModel) return;

    try {
      setDeploying(true);
      
      const response = await fetch(`/api/internal/v1/ai-models/${selectedModel.id}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          ...deploymentForm,
          modelId: selectedModel.id,
          deployedBy: userId
        })
      });

      if (response.ok) {
        alert('Model deployment initiated successfully!');
        await loadModels(); // Refresh model list
        setActiveTab('monitor'); // Switch to monitoring tab
      } else {
        const errorData = await response.json();
        alert(`Deployment failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error deploying model:', error);
      alert('Error deploying model. Please try again.');
    } finally {
      setDeploying(false);
    }
  };

  const activateModel = async (modelId: string) => {
    try {
      const response = await fetch(`/api/internal/v1/ai-models/${modelId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        alert('Model activated successfully!');
        await loadModels();
      } else {
        const errorData = await response.json();
        alert(`Activation failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error activating model:', error);
      alert('Error activating model. Please try again.');
    }
  };

  const deactivateModel = async (modelId: string) => {
    if (!confirm('Are you sure you want to deactivate this model? This will stop all inferences.')) {
      return;
    }

    try {
      const response = await fetch(`/api/internal/v1/ai-models/${modelId}/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        alert('Model deactivated successfully!');
        await loadModels();
      } else {
        const errorData = await response.json();
        alert(`Deactivation failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error deactivating model:', error);
      alert('Error deactivating model. Please try again.');
    }
  };

  const rollbackModel = async (modelId: string) => {
    if (!confirm('Are you sure you want to rollback to the previous version? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/internal/v1/ai-models/${modelId}/rollback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        alert('Model rollback completed successfully!');
        await loadModels();
      } else {
        const errorData = await response.json();
        alert(`Rollback failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error rolling back model:', error);
      alert('Error rolling back model. Please try again.');
    }
  };

  // ===========================
  // UTILITY FUNCTIONS
  // ===========================

  const getModelStatusColor = (status: AIModel['status']) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#6b7280';
      case 'deploying': return '#f59e0b';
      case 'training': return '#3b82f6';
      case 'failed': return '#ef4444';
      case 'archived': return '#9ca3af';
      default: return '#6b7280';
    }
  };

  const getAlertSeverityColor = (severity: PerformanceAlert['severity']) => {
    switch (severity) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#f97316';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (milliseconds: number) => {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
    return `${(milliseconds / 60000).toFixed(1)}m`;
  };

  // Check permissions
  const canManageModels = ['super_admin', 'admin_cto', 'admin_ceo'].includes(userRole);
  const canViewMetrics = [...['super_admin', 'admin_cto', 'admin_ceo'], 'manager', 'operations_manager'].includes(userRole);

  // ===========================
  // RENDER FUNCTIONS
  // ===========================

  const renderModelOverview = () => (
    <div className="models-overview">
      <div className="models-grid">
        {models.map(model => (
          <div 
            key={model.id} 
            className={`model-card ${selectedModel?.id === model.id ? 'selected' : ''}`}
            onClick={() => setSelectedModel(model)}
          >
            <div className="model-header">
              <h3>{model.name}</h3>
              <span 
                className="model-status"
                style={{ backgroundColor: getModelStatusColor(model.status) }}
              >
                {model.status}
              </span>
            </div>
            
            <div className="model-details">
              <p><strong>Type:</strong> {model.type}</p>
              <p><strong>Version:</strong> {model.version}</p>
              <p><strong>Environment:</strong> {model.environment}</p>
              <p><strong>Accuracy:</strong> {(model.accuracy * 100).toFixed(1)}%</p>
              <p><strong>Uptime:</strong> {model.performanceMetrics.uptime.toFixed(1)}%</p>
            </div>
            
            {canManageModels && (
              <div className="model-actions">
                {model.status === 'inactive' ? (
                  <button 
                    onClick={(e) => { e.stopPropagation(); activateModel(model.id); }}
                    className="btn-primary btn-sm"
                  >
                    Activate
                  </button>
                ) : (
                  <button 
                    onClick={(e) => { e.stopPropagation(); deactivateModel(model.id); }}
                    className="btn-secondary btn-sm"
                  >
                    Deactivate
                  </button>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); rollbackModel(model.id); }}
                  className="btn-warning btn-sm"
                >
                  Rollback
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderDeployment = () => (
    <div className="deployment-section">
      {!selectedModel ? (
        <div className="no-selection">
          <p>Please select a model to deploy</p>
        </div>
      ) : (
        <div className="deployment-form">
          <h3>Deploy {selectedModel.name} v{selectedModel.version}</h3>
          
          <div className="form-section">
            <div className="form-group">
              <label>Target Environment</label>
              <select
                value={deploymentForm.targetEnvironment}
                onChange={(e) => setDeploymentForm(prev => ({
                  ...prev,
                  targetEnvironment: e.target.value as any
                }))}
              >
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
            </div>

            <div className="form-group">
              <label>Max Instances</label>
              <input
                type="number"
                min="1"
                max="10"
                value={deploymentForm.maxInstances}
                onChange={(e) => setDeploymentForm(prev => ({
                  ...prev,
                  maxInstances: parseInt(e.target.value)
                }))}
              />
            </div>
          </div>

          <div className="form-section">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={deploymentForm.rollbackPlan}
                  onChange={(e) => setDeploymentForm(prev => ({
                    ...prev,
                    rollbackPlan: e.target.checked
                  }))}
                />
                Enable Rollback Plan
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={deploymentForm.healthChecks}
                  onChange={(e) => setDeploymentForm(prev => ({
                    ...prev,
                    healthChecks: e.target.checked
                  }))}
                />
                Enable Health Checks
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={deploymentForm.autoScale}
                  onChange={(e) => setDeploymentForm(prev => ({
                    ...prev,
                    autoScale: e.target.checked
                  }))}
                />
                Enable Auto-scaling
              </label>
            </div>
          </div>

          <div className="deployment-summary">
            <h4>Deployment Summary</h4>
            <ul>
              <li>Model: {selectedModel.name} v{selectedModel.version}</li>
              <li>Target: {deploymentForm.targetEnvironment}</li>
              <li>Instances: Up to {deploymentForm.maxInstances}</li>
              <li>GPU Memory Required: {selectedModel.hardwareRequirements.gpuMemory}</li>
              <li>CPU Cores Required: {selectedModel.hardwareRequirements.cpuCores}</li>
            </ul>
          </div>

          <div className="deployment-actions">
            <button 
              onClick={deployModel}
              disabled={deploying}
              className="btn-primary"
            >
              {deploying ? 'Deploying...' : 'Deploy Model'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderMonitoring = () => (
    <div className="monitoring-section">
      <div className="metrics-grid">
        {/* Real-time Metrics */}
        <div className="metrics-card">
          <h4>Real-time Performance</h4>
          <div className="metrics-list">
            <div className="metric-item">
              <span className="metric-label">Active Inferences</span>
              <span className="metric-value">{realtimeMetrics.activeInferences}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Queued Requests</span>
              <span className="metric-value">{realtimeMetrics.queuedRequests}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Avg Response Time</span>
              <span className="metric-value">{formatDuration(realtimeMetrics.averageResponseTime)}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Success Rate</span>
              <span className="metric-value">{(realtimeMetrics.successRate * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Hardware Stats */}
        <div className="metrics-card">
          <h4>Hardware Utilization</h4>
          <div className="metrics-list">
            <div className="metric-item">
              <span className="metric-label">GPU Usage</span>
              <span className="metric-value">{hardwareStats.gpuUtilization.toFixed(1)}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">CPU Usage</span>
              <span className="metric-value">{hardwareStats.cpuUtilization.toFixed(1)}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Memory Usage</span>
              <span className="metric-value">{hardwareStats.memoryUsage.toFixed(1)}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Temperature</span>
              <span className="metric-value">{hardwareStats.temperature}°C</span>
            </div>
          </div>
        </div>

        {/* Model Performance */}
        {selectedModel && (
          <div className="metrics-card">
            <h4>{selectedModel.name} Performance</h4>
            <div className="metrics-list">
              <div className="metric-item">
                <span className="metric-label">Accuracy</span>
                <span className="metric-value">{(selectedModel.accuracy * 100).toFixed(1)}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Confidence</span>
                <span className="metric-value">{(selectedModel.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Inference Time</span>
                <span className="metric-value">{formatDuration(selectedModel.performanceMetrics.inferenceTime)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Throughput</span>
                <span className="metric-value">{selectedModel.performanceMetrics.throughput} req/s</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alerts Section */}
      <div className="alerts-section">
        <h4>Performance Alerts</h4>
        {alerts.length === 0 ? (
          <div className="no-alerts">
            <p>No active alerts</p>
          </div>
        ) : (
          <div className="alerts-list">
            {alerts.filter(alert => !alert.resolved).map(alert => (
              <div 
                key={alert.id} 
                className="alert-item"
                style={{ borderLeft: `4px solid ${getAlertSeverityColor(alert.severity)}` }}
              >
                <div className="alert-header">
                  <span className="alert-type">{alert.alertType.replace('_', ' ')}</span>
                  <span 
                    className="alert-severity"
                    style={{ color: getAlertSeverityColor(alert.severity) }}
                  >
                    {alert.severity}
                  </span>
                </div>
                <div className="alert-message">{alert.message}</div>
                <div className="alert-timestamp">{new Date(alert.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderTraining = () => (
    <div className="training-section">
      {!selectedModel ? (
        <div className="no-selection">
          <p>Please select a model to view training data</p>
        </div>
      ) : (
        <div className="training-data">
          <h3>Training Data - {selectedModel.name}</h3>
          
          <div className="training-stats">
            <div className="stat-card">
              <h4>Total Samples</h4>
              <div className="stat-value">{selectedModel.trainingData.totalSamples.toLocaleString()}</div>
            </div>
            
            <div className="stat-card">
              <h4>Annotation Progress</h4>
              <div className="stat-value">{selectedModel.trainingData.annotationProgress.toFixed(1)}%</div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${selectedModel.trainingData.annotationProgress}%` }}
                />
              </div>
            </div>
            
            <div className="stat-card">
              <h4>Last Annotated</h4>
              <div className="stat-value">
                {new Date(selectedModel.trainingData.lastAnnotated).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="training-actions">
            <button className="btn-primary">
              Upload Training Data
            </button>
            <button className="btn-secondary">
              Export Annotations
            </button>
            <button className="btn-secondary">
              Start Training Job
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ===========================
  // MAIN RENDER
  // ===========================

  if (!canViewMetrics) {
    return (
      <div className="ai-model-manager-container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to manage AI models.</p>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-model-manager-container">
      {/* Header */}
      <div className="ai-model-manager-header">
        <h1>AI Model Manager</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={loadModels}>
            Refresh
          </button>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Models Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'deploy' ? 'active' : ''}`}
          onClick={() => setActiveTab('deploy')}
          disabled={!canManageModels}
        >
          Deploy
        </button>
        <button 
          className={`tab-button ${activeTab === 'monitor' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitor')}
        >
          Monitor
        </button>
        <button 
          className={`tab-button ${activeTab === 'training' ? 'active' : ''}`}
          onClick={() => setActiveTab('training')}
        >
          Training Data
        </button>
      </div>

      {/* Content */}
      <div className="ai-model-manager-content">
        {loading ? (
          <div className="loading-state">
            <p>Loading AI models...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderModelOverview()}
            {activeTab === 'deploy' && renderDeployment()}
            {activeTab === 'monitor' && renderMonitoring()}
            {activeTab === 'training' && renderTraining()}
          </>
        )}
      </div>
    </div>
  );
};

export default AIModelManager;
