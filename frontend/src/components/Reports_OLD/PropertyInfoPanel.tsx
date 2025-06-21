// File: frontend/src/components/Reports/PropertyInfoPanel.tsx - LOOP FIX
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { ClientData, MetricsData } from '../../types/reports';
import { useReportData, updateMetrics } from '../../context/ReportDataContext';
import { 
  saveEditedMetrics, 
  loadEditedMetrics, 
  clearEditedMetrics, 
  hasEditedMetrics,
  cleanupOldMetrics 
} from '../../utils/metricsLocalStorage';

// --- THEME ASSET ---
import marbleTexture from '../../assets/marble-texture.png';

// =============== STYLED COMPONENTS (Theme & Color Adjusted) ===============
const Section = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  color: #faf0e6;
  background-image: url(${marbleTexture});
  background-size: cover;
  background-position: center;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    border-radius: 8px;
    z-index: 1;
  }

  & > * {
    position: relative;
    z-index: 2;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 238, 170, 0.2);
  padding-bottom: 0.75rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  color: #eee8aa;
  font-weight: 600;
  margin: 0;
`;

const EditButton = styled.button`
  background: none;
  border: 1px solid rgba(255, 238, 170, 0.5);
  cursor: pointer;
  color: #eee8aa;
  font-weight: 500;
  font-size: 0.9rem;
  padding: 4px 10px;
  border-radius: 4px;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background-color: rgba(238, 232, 170, 0.15);
    color: #fffacd;
  }
`;

const SaveCancelContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ variant: 'save' | 'cancel' }>`
  border: none;
  border-radius: 4px;
  padding: 4px 10px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: background-color 0.2s ease, opacity 0.2s ease;

  ${({ variant }) =>
    variant === 'save'
      ? `
    background-color: #28a745;
    color: white;
    &:hover { background-color: #218838; }
  `
      : `
    background-color: #f8f9fa;
    color: #dc3545;
    border: 1px solid #ddd;
    &:hover { background-color: #e2e6ea; opacity: 0.9; }
  `}
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
`;

const MetricCard = styled.div`
  background: rgba(10, 10, 10, 0.6);
  border: 1px solid rgba(255, 238, 170, 0.15);
  border-radius: 6px;
  padding: 1.25rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    background: rgba(20, 20, 20, 0.7);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

const MetricTitle = styled.h4`
  font-size: 0.875rem;
  color: #eee8aa;
  margin-bottom: 0.5rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MetricValue = styled.div<{ size?: 'small' | 'medium' | 'large' }>`
  font-size: ${(props) =>
    props.size === 'large' ? '2rem' : props.size === 'medium' ? '1.5rem' : '1.25rem'};
  font-weight: 600;
  color: #faf0e6;
  line-height: 1.2;
`;

const MetricDetail = styled.div`
  font-size: 0.8rem;
  color: #e0e0e0;
  margin-top: 0.5rem;
  line-height: 1.4;
`;

const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #faf0e6;

  th,
  td {
    padding: 0.6rem 0.75rem;
    border: 1px solid rgba(238, 232, 170, 0.2);
    text-align: left;
    vertical-align: middle;
  }

  th {
    background-color: rgba(0, 0, 0, 0.5);
    font-weight: 600;
    color: #eee8aa;
  }

  tbody tr {
    background-color: rgba(0, 0, 0, 0.2);
  }

  tbody tr:nth-child(even) {
    background-color: rgba(0, 0, 0, 0.3);
  }

  tbody tr:hover {
    background-color: rgba(238, 232, 170, 0.08);
  }

  tfoot {
    font-weight: 600;
    background-color: rgba(0, 0, 0, 0.5);
    color: #eee8aa;
  }
`;

const EditableInput = styled.input`
  width: calc(100% - 1rem);
  padding: 0.5rem;
  border: 1px solid rgba(238, 232, 170, 0.3);
  border-radius: 4px;
  font-size: 0.875rem;
  box-sizing: border-box;
  background-color: rgba(0, 0, 0, 0.4);
  color: #faf0e6;

  &:focus {
    border-color: #eee8aa;
    outline: 0;
    box-shadow: 0 0 0 0.2rem rgba(238, 232, 170, 0.25);
    background-color: rgba(0, 0, 0, 0.5);
  }
`;

const UnsavedChangesIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 4px;
  color: #ffc107;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  
  &::before {
    content: '💾';
    font-size: 1rem;
  }
`;

// =============== INTERFACES & TYPES ===============
interface CalculatedMetrics {
  totalHumanIntrusions: number;
  totalVehicleIntrusions: number;
  avgHumanIntrusionsPerDay: number;
  avgVehicleIntrusionsPerDay: number;
  peakHumanDay: string;
  peakVehicleDay: string;
  cameraUptime: number;
  responseEfficiency: number;
}

interface PropertyInfoPanelProps {
  clientData?: ClientData | null;
  dateRange?: { start: Date; end: Date };
}

// =============== UTILITY FUNCTIONS ===============
const createDefaultMetrics = (): MetricsData => ({
  humanIntrusions: { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 },
  vehicleIntrusions: { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 },
  potentialThreats: 0,
  proactiveAlerts: 0,
  responseTime: 0,
  aiAccuracy: 0,
  totalCameras: 0,
  camerasOnline: 0,
  totalMonitoringHours: 168, // HARDCODED: Always 168 hours (24/7 for 1 week)
  operationalUptime: 0,
});

// =============== COMPONENT ===============
const PropertyInfoPanel: React.FC<PropertyInfoPanelProps> = ({
  clientData: propClientData,
  dateRange: propDateRange,
}) => {
  // Use context values but allow prop overrides for flexibility
  const contextData = useReportData();
  
  // Use props if provided, otherwise fall back to context values
  const client = propClientData || contextData.client;
  const metrics = contextData.metrics || createDefaultMetrics();
  const dateRange = propDateRange || contextData.dateRange;
  const setContextMetrics = contextData.setMetrics;
  
  // 🚨 CRITICAL LOOP FIX: Prevent infinite state updates
  const isUserInteractingRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClientIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  
  // Create a stable callback that updates context
  const handleMetricsChange = useCallback((updatedMetrics: Partial<MetricsData>) => {
    console.log('🔄 PropertyInfoPanel: Handling metrics change');
    
    // Always update context
    if (setContextMetrics) {
      const newMetrics = updateMetrics(metrics, updatedMetrics);
      setContextMetrics(newMetrics);
    }
  }, [setContextMetrics, metrics]);

  const [isEditing, setIsEditing] = useState(false);
  const [editedMetrics, setEditedMetrics] = useState<MetricsData>(() => ({
    ...createDefaultMetrics(),
    ...metrics,
  }));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 🚨 CRITICAL FIX: Only update editedMetrics when client changes or component initializes
  useEffect(() => {
    const currentClientId = client?.id || null;
    
    // Only update if client changed or initial load
    if (currentClientId !== lastClientIdRef.current || !isInitializedRef.current) {
      console.log('📊 PropertyInfoPanel: Client changed, updating metrics', {
        oldClientId: lastClientIdRef.current,
        newClientId: currentClientId,
        isInitialized: isInitializedRef.current
      });
      
      lastClientIdRef.current = currentClientId;
      isInitializedRef.current = true;
      
      // Only update if not actively editing
      if (!isEditing) {
        setEditedMetrics({
          ...createDefaultMetrics(),
          ...metrics,
        });
      }
    }
  }, [client?.id, metrics, isEditing]);

  // 🎯 APEX AI ALCHEMIST - LOCALSTORAGE INTEGRATION (LOOP SAFE)
  // Load saved metrics when client changes
  useEffect(() => {
    if (!client?.id) return;
    
    console.log('🔄 PropertyInfoPanel: Checking localStorage for client:', client.id);
    
    // Cleanup old metrics on mount
    cleanupOldMetrics();
    
    // Try to load saved metrics for this client
    const savedData = loadEditedMetrics(client.id);
    if (savedData) {
      console.log('💾 Restoring saved metrics for client:', client.name);
      setEditedMetrics(savedData.metrics);
      setIsEditing(savedData.isEditing);
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [client?.id]); // Only depend on client ID

  // 🚨 CRITICAL FIX: Improved debounced localStorage save
  const debouncedSave = useCallback((clientId: string, clientName: string, metricsToSave: MetricsData) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      // Only save if still editing and user is not actively typing
      if (isEditing && !isUserInteractingRef.current) {
        const saved = saveEditedMetrics(clientId, clientName, metricsToSave, true);
        if (saved) {
          console.log('💾 Auto-saved edited metrics (debounced):', clientName);
        }
      }
      saveTimeoutRef.current = null;
    }, 2000); // Increased debounce to 2 seconds to prevent interruptions
  }, [isEditing]);

  // Save metrics to localStorage with debouncing (ONLY when editing)
  useEffect(() => {
    if (!isEditing || !client?.id || !client?.name || isUserInteractingRef.current) return;
    
    console.log('💾 PropertyInfoPanel: Scheduling debounced save');
    debouncedSave(client.id, client.name, editedMetrics);
    
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editedMetrics, isEditing, client?.id, client?.name, debouncedSave]);

  // Clear localStorage when editing stops
  useEffect(() => {
    if (!isEditing && client?.id && !hasUnsavedChanges) {
      console.log('🗑️ PropertyInfoPanel: Clearing localStorage (editing stopped)');
      clearEditedMetrics(client.id);
    }
  }, [isEditing, client?.id, hasUnsavedChanges]);

  const calculatedMetrics: CalculatedMetrics = useMemo(() => {
    const data = isEditing ? editedMetrics : metrics;
    const safeData = { ...createDefaultMetrics(), ...data };
    const humanIntrusions = safeData.humanIntrusions as Record<string, number>;
    const vehicleIntrusions = safeData.vehicleIntrusions as Record<string, number>;

    const totalHumanIntrusions = (Object.values(humanIntrusions) as number[]).reduce(
      (sum, value) => sum + value,
      0
    );
    const totalVehicleIntrusions = (Object.values(vehicleIntrusions) as number[]).reduce(
      (sum, value) => sum + value,
      0
    );
    const numDays = 7;
    const avgHumanIntrusionsPerDay = numDays > 0 ? totalHumanIntrusions / numDays : 0;
    const avgVehicleIntrusionsPerDay = numDays > 0 ? totalVehicleIntrusions / numDays : 0;
    const findPeakDay = (intrusions: Record<string, number>): string => {
      const entries = Object.entries(intrusions);
      if (entries.length === 0) return 'N/A';
      return entries.reduce(
        (max, [day, count]: [string, number]) => (count > max[1] ? [day, count] : max),
        ['', 0]
      )[0] || 'N/A';
    };
    const peakHumanDay = findPeakDay(humanIntrusions);
    const peakVehicleDay = findPeakDay(vehicleIntrusions);
    const totalCamerasSafe = Number(safeData.totalCameras) || 0;
    const camerasOnlineSafe = Number(safeData.camerasOnline) || 0;
    const cameraUptime = totalCamerasSafe > 0 ? (camerasOnlineSafe / totalCamerasSafe) * 100 : 0;
    const responseTimeSafe = Number(safeData.responseTime) || 0;
    const responseEfficiency = Math.max(0, 100 - (responseTimeSafe / 2 * 100));
    return {
      totalHumanIntrusions,
      totalVehicleIntrusions,
      avgHumanIntrusionsPerDay: Number.isNaN(avgHumanIntrusionsPerDay) ? 0 : avgHumanIntrusionsPerDay,
      avgVehicleIntrusionsPerDay: Number.isNaN(avgVehicleIntrusionsPerDay) ? 0 : avgVehicleIntrusionsPerDay,
      peakHumanDay,
      peakVehicleDay,
      cameraUptime: Number.isNaN(cameraUptime) ? 0 : cameraUptime,
      responseEfficiency: Number.isNaN(responseEfficiency) ? 0 : responseEfficiency,
    };
  }, [isEditing, editedMetrics, metrics]);

  // 🚨 CRITICAL FIX: Improved user interaction tracking
  const handleMetricChange = (key: keyof MetricsData, rawValue: string) => {
    isUserInteractingRef.current = true;
    
    const isFloat = key === 'aiAccuracy' || key === 'responseTime' || key === 'operationalUptime';
    const value = isFloat ? parseFloat(rawValue) : parseInt(rawValue, 10);
    
    setEditedMetrics((prev) => ({ ...prev, [key]: Number.isNaN(value) ? 0 : value }));
    
    // Reset interaction flag after a longer delay to prevent interruptions
    setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 1000);
  };

  // 🚨 CRITICAL FIX: Improved daily metrics handling
  const handleDailyMetricChange = (
    metricType: 'humanIntrusions' | 'vehicleIntrusions',
    day: string,
    rawValue: string
  ) => {
    isUserInteractingRef.current = true;
    
    const value = parseInt(rawValue, 10);
    setEditedMetrics((prev) => ({
      ...prev,
      [metricType]: { ...(prev[metricType] || {}), [day]: Number.isNaN(value) ? 0 : value },
    }));
    
    // Reset interaction flag after a longer delay to prevent interruptions
    setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 1000);
  };

  const handleSaveChanges = () => {
    console.log('💾 PropertyInfoPanel: Saving changes');
    
    // Call the unified metrics update function to update both props and context
    handleMetricsChange(editedMetrics);
    setIsEditing(false);
    setHasUnsavedChanges(false);
    
    // Clear localStorage since changes have been saved
    if (client?.id) {
      clearEditedMetrics(client.id);
      console.log('📋 Metrics saved successfully, cleared localStorage for:', client.name);
    }
  };
  
  const handleCancelChanges = () => {
    console.log('❌ PropertyInfoPanel: Canceling changes');
    
    setEditedMetrics({ ...createDefaultMetrics(), ...metrics });
    setIsEditing(false);
    setHasUnsavedChanges(false);
    
    // Clear localStorage since changes were canceled
    if (client?.id) {
      clearEditedMetrics(client.id);
      console.log('❌ Metrics editing canceled, cleared localStorage for:', client.name);
    }
  };
  
  const getCurrentMetric = (key: keyof MetricsData): number => {
    if (key === 'humanIntrusions' || key === 'vehicleIntrusions') return 0;
    const source = isEditing ? editedMetrics : metrics;
    const value = source[key];
    const numValue = Number(value);
    return Number.isNaN(numValue) ? 0 : numValue;
  };
  
  const getCurrentDailyMetric = (type: 'humanIntrusions' | 'vehicleIntrusions', day: string): number => {
    const source = isEditing ? editedMetrics : metrics;
    const value = source?.[type]?.[day];
    const numValue = Number(value);
    return Number.isNaN(numValue) ? 0 : numValue;
  };

  return (
    <div>
      {!client ? (
        <Section>
          <p style={{ position: 'relative', zIndex: 2 }}>Please select a client first.</p>
        </Section>
      ) : (
        <>
          {/* Section 1: Property & Site Information */}
          <Section>
            <SectionHeader>
              <SectionTitle>Property & Site Information</SectionTitle>
            </SectionHeader>
            <InfoGrid>
              <MetricCard>
                <MetricTitle>Site Name</MetricTitle>
                <MetricValue>{client.siteName || client.name}</MetricValue>
                <MetricDetail>
                  Monitoring Period: {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
                </MetricDetail>
              </MetricCard>
              <MetricCard>
                <MetricTitle>Location</MetricTitle>
                <MetricValue size="medium">{client.location || 'N/A'}</MetricValue>
                <MetricDetail>
                  {client.city}, {client.state} {client.zipCode}
                </MetricDetail>
              </MetricCard>
              <MetricCard>
                <MetricTitle>Camera Coverage</MetricTitle>
                <MetricValue>
                  {getCurrentMetric('camerasOnline')} / {getCurrentMetric('totalCameras')}
                </MetricValue>
                <MetricDetail>
                  Camera Uptime: {calculatedMetrics.cameraUptime.toFixed(1)}% 
                  {client?.cameras && getCurrentMetric('totalCameras') === client.cameras && (
                    <span style={{ color: '#28a745', marginLeft: '0.5rem' }}>✓ Synced from client</span>
                  )}
                </MetricDetail>
              </MetricCard>
              <MetricCard>
                <MetricTitle>Camera Type</MetricTitle>
                <MetricValue size="medium">{client.cameraType || 'Standard IP'}</MetricValue>
                <MetricDetail>
                  {client.cameraDetails || 'High-definition cameras'}
                  {client?.cameras && (
                    <div style={{ color: '#28a745', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                      📹 {client.cameras} cameras configured
                    </div>
                  )}
                </MetricDetail>
              </MetricCard>
            </InfoGrid>
          </Section>

          {/* Section 2: AI Insights & Metrics */}
          <Section>
            <SectionHeader>
              <SectionTitle>AI-Driven Insights & Metrics</SectionTitle>
              {!isEditing ? (
                <EditButton onClick={() => setIsEditing(true)}>Edit Metrics</EditButton>
              ) : (
                <SaveCancelContainer>
                  <ActionButton variant="cancel" onClick={handleCancelChanges}>
                    Cancel
                  </ActionButton>
                  <ActionButton variant="save" onClick={handleSaveChanges}>
                    Save Changes
                  </ActionButton>
                </SaveCancelContainer>
              )}
            </SectionHeader>
            
            {/* Unsaved Changes Indicator */}
            {hasUnsavedChanges && (
              <UnsavedChangesIndicator>
                Unsaved changes restored from previous session. Continue editing or save your changes.
              </UnsavedChangesIndicator>
            )}
            <InfoGrid>
              <MetricCard>
                <MetricTitle>Total Human Intrusions</MetricTitle>
                <MetricValue size="large">{calculatedMetrics.totalHumanIntrusions}</MetricValue>
                <MetricDetail>
                  Avg. {calculatedMetrics.avgHumanIntrusionsPerDay.toFixed(1)} / day | Peak:{' '}
                  {calculatedMetrics.peakHumanDay}
                </MetricDetail>
              </MetricCard>
              <MetricCard>
                <MetricTitle>Total Vehicle Intrusions</MetricTitle>
                <MetricValue size="large">{calculatedMetrics.totalVehicleIntrusions}</MetricValue>
                <MetricDetail>
                  Avg. {calculatedMetrics.avgVehicleIntrusionsPerDay.toFixed(1)} / day | Peak:{' '}
                  {calculatedMetrics.peakVehicleDay}
                </MetricDetail>
              </MetricCard>
              <MetricCard>
                <MetricTitle>Potential Threats</MetricTitle>
                <MetricValue size="large">{Number(getCurrentMetric('potentialThreats'))}</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricTitle>Proactive Alerts</MetricTitle>
                <MetricValue size="large">{Number(getCurrentMetric('proactiveAlerts'))}</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricTitle>AI Accuracy</MetricTitle>
                <MetricValue>{Number(getCurrentMetric('aiAccuracy')).toFixed(1)}%</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricTitle>Avg. Response Time</MetricTitle>
                <MetricValue>{Number(getCurrentMetric('responseTime')).toFixed(1)} sec</MetricValue>
                <MetricDetail>Efficiency: {calculatedMetrics.responseEfficiency.toFixed(1)}%</MetricDetail>
              </MetricCard>
              <MetricCard>
                <MetricTitle>Monitoring Hours</MetricTitle>
                <MetricValue>168</MetricValue>
                <MetricDetail>24/7 monitoring for 1 week (24 × 7 days)</MetricDetail>
              </MetricCard>
              <MetricCard>
                <MetricTitle>Operational Uptime</MetricTitle>
                <MetricValue>{Number(getCurrentMetric('operationalUptime')).toFixed(1)}%</MetricValue>
              </MetricCard>
            </InfoGrid>

            {/* Editable Input Grid */}
            {isEditing && (
              <InfoGrid
                style={{
                  marginTop: '2rem',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '1rem',
                  borderRadius: '6px',
                  border: '1px dashed rgba(238, 232, 170, 0.4)',
                }}
              >
                <MetricCard>
                  <MetricTitle>Potential Threats</MetricTitle>
                  <EditableInput
                    type="number"
                    value={getCurrentMetric('potentialThreats')}
                    onChange={(e) => handleMetricChange('potentialThreats', e.target.value)}
                    onFocus={() => { isUserInteractingRef.current = true; }}
                    onBlur={() => { setTimeout(() => isUserInteractingRef.current = false, 500); }}
                  />
                </MetricCard>
                <MetricCard>
                  <MetricTitle>Proactive Alerts</MetricTitle>
                  <EditableInput
                    type="number"
                    value={getCurrentMetric('proactiveAlerts')}
                    onChange={(e) => handleMetricChange('proactiveAlerts', e.target.value)}
                    onFocus={() => { isUserInteractingRef.current = true; }}
                    onBlur={() => { setTimeout(() => isUserInteractingRef.current = false, 500); }}
                  />
                </MetricCard>
                <MetricCard>
                  <MetricTitle>AI Accuracy (%)</MetricTitle>
                  <EditableInput
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={getCurrentMetric('aiAccuracy')}
                    onChange={(e) => handleMetricChange('aiAccuracy', e.target.value)}
                    onFocus={() => { isUserInteractingRef.current = true; }}
                    onBlur={() => { setTimeout(() => isUserInteractingRef.current = false, 500); }}
                  />
                </MetricCard>
                <MetricCard>
                  <MetricTitle>Avg. Response Time (sec)</MetricTitle>
                  <EditableInput
                    type="number"
                    step="0.1"
                    min="0"
                    value={getCurrentMetric('responseTime')}
                    onChange={(e) => handleMetricChange('responseTime', e.target.value)}
                    onFocus={() => { isUserInteractingRef.current = true; }}
                    onBlur={() => { setTimeout(() => isUserInteractingRef.current = false, 500); }}
                  />
                </MetricCard>
                <MetricCard>
                  <MetricTitle>Total Cameras</MetricTitle>
                  <EditableInput
                    type="number"
                    min="0"
                    value={getCurrentMetric('totalCameras')}
                    onChange={(e) => handleMetricChange('totalCameras', e.target.value)}
                    onFocus={() => { isUserInteractingRef.current = true; }}
                    onBlur={() => { setTimeout(() => isUserInteractingRef.current = false, 500); }}
                  />
                </MetricCard>
                <MetricCard>
                  <MetricTitle>Cameras Online</MetricTitle>
                  <EditableInput
                    type="number"
                    min="0"
                    value={getCurrentMetric('camerasOnline')}
                    onChange={(e) => handleMetricChange('camerasOnline', e.target.value)}
                    onFocus={() => { isUserInteractingRef.current = true; }}
                    onBlur={() => { setTimeout(() => isUserInteractingRef.current = false, 500); }}
                  />
                </MetricCard>
                <MetricCard>
                  <MetricTitle>Operational Uptime (%)</MetricTitle>
                  <EditableInput
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={getCurrentMetric('operationalUptime')}
                    onChange={(e) => handleMetricChange('operationalUptime', e.target.value)}
                    onFocus={() => { isUserInteractingRef.current = true; }}
                    onBlur={() => { setTimeout(() => isUserInteractingRef.current = false, 500); }}
                  />
                </MetricCard>
              </InfoGrid>
            )}
          </Section>

          {/* Section 2.5: Contact & Communication Information */}
          <Section>
            <SectionHeader>
              <SectionTitle>Security Contact Information</SectionTitle>
            </SectionHeader>
            <InfoGrid>
              <MetricCard>
                <MetricTitle>Security Company Contact</MetricTitle>
                <MetricValue size="medium">it@defenseic.com</MetricValue>
                <MetricDetail>
                  Primary contact for all security reports and incidents
                </MetricDetail>
              </MetricCard>
              <MetricCard>
                <MetricTitle>Client Property Contact</MetricTitle>
                <MetricValue size="medium">{client.contactEmail || 'N/A'}</MetricValue>
                <MetricDetail>
                  Property management contact for {client.name}
                </MetricDetail>
              </MetricCard>
              <MetricCard>
                <MetricTitle>Emergency Response</MetricTitle>
                <MetricValue>24/7</MetricValue>
                <MetricDetail>
                  Round-the-clock monitoring and incident response
                  <div style={{ color: '#28a745', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                    🚨 Emergency protocols active
                  </div>
                </MetricDetail>
              </MetricCard>
            </InfoGrid>
          </Section>

          {/* Section 3: Daily Data Table */}
          <Section>
            <SectionHeader>
              <SectionTitle>Daily Intrusion Data</SectionTitle>
            </SectionHeader>
            <DataTable>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Human Intrusions</th>
                  <th>Vehicle Intrusions</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <tr key={day}>
                    <td>{day}</td>
                    <td>
                      {isEditing ? (
                        <EditableInput
                          type="number"
                          min="0"
                          value={getCurrentDailyMetric('humanIntrusions', day)}
                          onChange={(e) => handleDailyMetricChange('humanIntrusions', day, e.target.value)}
                          onFocus={() => { isUserInteractingRef.current = true; }}
                          onBlur={() => { setTimeout(() => isUserInteractingRef.current = false, 500); }}
                        />
                      ) : (
                        getCurrentDailyMetric('humanIntrusions', day)
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <EditableInput
                          type="number"
                          min="0"
                          value={getCurrentDailyMetric('vehicleIntrusions', day)}
                          onChange={(e) => handleDailyMetricChange('vehicleIntrusions', day, e.target.value)}
                          onFocus={() => { isUserInteractingRef.current = true; }}
                          onBlur={() => { setTimeout(() => isUserInteractingRef.current = false, 500); }}
                        />
                      ) : (
                        getCurrentDailyMetric('vehicleIntrusions', day)
                      )}
                    </td>
                    <td>{getCurrentDailyMetric('humanIntrusions', day) + getCurrentDailyMetric('vehicleIntrusions', day)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>Totals</th>
                  <th>{calculatedMetrics.totalHumanIntrusions}</th>
                  <th>{calculatedMetrics.totalVehicleIntrusions}</th>
                  <th>{calculatedMetrics.totalHumanIntrusions + calculatedMetrics.totalVehicleIntrusions}</th>
                </tr>
              </tfoot>
            </DataTable>
          </Section>
        </>
      )}
    </div>
  );
}

export default PropertyInfoPanel;
