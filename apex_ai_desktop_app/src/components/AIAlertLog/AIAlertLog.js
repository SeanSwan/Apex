/**
 * AI ALERT LOG COMPONENT
 * ======================
 * Comprehensive log of all AI security alerts
 * Features: Filtering, search, export, detailed alert information
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const LogContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background};
`;

const LogHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
  padding-bottom: ${props => props.theme.spacing.md};
  border-bottom: 2px solid ${props => props.theme.colors.border};
`;

const LogTitle = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const LogControls = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  align-items: center;
`;

const SearchInput = styled.input`
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.backgroundCard};
  color: ${props => props.theme.colors.text};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  width: 250px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textMuted};
  }
`;

const FilterSelect = styled.select`
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.backgroundCard};
  color: ${props => props.theme.colors.text};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ExportButton = styled.button`
  background: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.background};
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.primaryDark};
  }
`;

const LogContent = styled.div`
  flex: 1;
  overflow-y: auto;
  background-color: ${props => props.theme.colors.backgroundCard};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
`;

const LogTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background-color: ${props => props.theme.colors.backgroundLight};
  position: sticky;
  top: 0;
  z-index: 1;
`;

const TableHeaderCell = styled.th`
  padding: ${props => props.theme.spacing.md};
  text-align: left;
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid ${props => props.theme.colors.border};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.03);
  }
`;

const TableCell = styled.td`
  padding: ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text};
  vertical-align: top;
`;

const PriorityBadge = styled.span`
  padding: 4px 8px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  text-transform: uppercase;
  background-color: ${props => {
    switch (props.priority) {
      case 'critical': return props.theme.colors.error;
      case 'high': return props.theme.colors.warning;
      case 'medium': return props.theme.colors.primary;
      default: return props.theme.colors.textMuted;
    }
  }};
  color: ${props => props.priority === 'medium' ? props.theme.colors.background : 'white'};
`;

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  text-transform: uppercase;
  background-color: ${props => {
    switch (props.status) {
      case 'resolved': return props.theme.colors.success;
      case 'investigating': return props.theme.colors.warning;
      case 'pending': return props.theme.colors.secondary;
      default: return props.theme.colors.textMuted;
    }
  }};
  color: white;
`;

const AlertDescription = styled.div`
  max-width: 300px;
  word-wrap: break-word;
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  flex-direction: column;
  color: ${props => props.theme.colors.textMuted};
  font-size: ${props => props.theme.typography.fontSize.lg};
  gap: ${props => props.theme.spacing.md};
`;

const StatsRow = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const StatCard = styled.div`
  background-color: ${props => props.theme.colors.backgroundCard};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  flex: 1;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.textSecondary};
`;

function AIAlertLog() {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');

  // Demo alerts data
  useEffect(() => {
    const generateDemoAlerts = () => {
      const alertTypes = [
        'Unknown Person Detected',
        'Loitering Detected',
        'Zone Breach Alert',
        'Face Recognition Match',
        'Threat Level Person',
        'Unauthorized Access Attempt'
      ];

      const priorities = ['critical', 'high', 'medium', 'low'];
      const statuses = ['pending', 'investigating', 'resolved'];
      const cameras = [
        'Main Entrance',
        'Parking Garage',
        'Elevator Bank',
        'Rooftop Access',
        'East Hallway',
        'Emergency Stairwell'
      ];

      const demoAlerts = [];
      const now = new Date();

      for (let i = 0; i < 50; i++) {
        const alertTime = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Last 7 days
        const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const camera = cameras[Math.floor(Math.random() * cameras.length)];

        demoAlerts.push({
          id: `alert_${i + 1}`,
          timestamp: alertTime.toISOString(),
          alert_type: alertType,
          priority,
          status,
          camera_location: camera,
          description: `${alertType} detected via AI monitoring system at ${camera}`,
          confidence: 0.75 + Math.random() * 0.25,
          response_time: status !== 'pending' ? Math.floor(Math.random() * 300) + 30 : null,
          assigned_to: status !== 'pending' ? 'Security Team Alpha' : null,
          details: {
            detection_count: Math.floor(Math.random() * 5) + 1,
            duration: Math.floor(Math.random() * 120) + 10,
            threat_level: priority === 'critical' ? 'high' : 'medium'
          }
        });
      }

      return demoAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    };

    setAlerts(generateDemoAlerts());
  }, []);

  // Filter and sort alerts
  useEffect(() => {
    let filtered = alerts.filter(alert => {
      const matchesSearch = searchTerm === '' || 
        alert.alert_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.camera_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPriority = priorityFilter === 'all' || alert.priority === priorityFilter;
      const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });

    // Sort alerts
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'timestamp') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredAlerts(filtered);
  }, [alerts, searchTerm, priorityFilter, statusFilter, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExport = async () => {
    try {
      const csvContent = [
        ['Timestamp', 'Alert Type', 'Priority', 'Status', 'Camera', 'Description', 'Confidence'],
        ...filteredAlerts.map(alert => [
          new Date(alert.timestamp).toLocaleString(),
          alert.alert_type,
          alert.priority,
          alert.status,
          alert.camera_location,
          alert.description,
          `${Math.round(alert.confidence * 100)}%`
        ])
      ].map(row => row.join(',')).join('\n');

      if (window.electronAPI) {
        const result = await window.electronAPI.showSaveDialog({
          defaultPath: `ai_alerts_${new Date().toISOString().split('T')[0]}.csv`,
          filters: [{ name: 'CSV files', extensions: ['csv'] }]
        });

        if (!result.canceled) {
          // In production, you'd save the file here
          console.log('Exporting alerts to:', result.filePath);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const calculateStats = () => {
    const total = alerts.length;
    const critical = alerts.filter(a => a.priority === 'critical').length;
    const resolved = alerts.filter(a => a.status === 'resolved').length;
    const pending = alerts.filter(a => a.status === 'pending').length;

    return { total, critical, resolved, pending };
  };

  const stats = calculateStats();

  return (
    <LogContainer>
      <LogHeader>
        <LogTitle>
          🚨 AI Alert Log
        </LogTitle>
        <LogControls>
          <SearchInput
            type="text"
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FilterSelect
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </FilterSelect>
          <FilterSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </FilterSelect>
          <ExportButton onClick={handleExport}>
            📊 Export CSV
          </ExportButton>
        </LogControls>
      </LogHeader>

      {/* Statistics */}
      <StatsRow>
        <StatCard>
          <StatValue>{stats.total}</StatValue>
          <StatLabel>Total Alerts</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.critical}</StatValue>
          <StatLabel>Critical</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.pending}</StatValue>
          <StatLabel>Pending</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.resolved}</StatValue>
          <StatLabel>Resolved</StatLabel>
        </StatCard>
      </StatsRow>

      {/* Alert Table */}
      <LogContent>
        {filteredAlerts.length === 0 ? (
          <EmptyState>
            <span style={{ fontSize: '48px' }}>🔍</span>
            <div>No alerts found</div>
            <div style={{ fontSize: '14px' }}>Try adjusting your filters</div>
          </EmptyState>
        ) : (
          <LogTable>
            <TableHeader>
              <tr>
                <TableHeaderCell onClick={() => handleSort('timestamp')}>
                  Timestamp {sortField === 'timestamp' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHeaderCell>
                <TableHeaderCell onClick={() => handleSort('alert_type')}>
                  Alert Type {sortField === 'alert_type' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHeaderCell>
                <TableHeaderCell onClick={() => handleSort('priority')}>
                  Priority {sortField === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHeaderCell>
                <TableHeaderCell onClick={() => handleSort('status')}>
                  Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHeaderCell>
                <TableHeaderCell onClick={() => handleSort('camera_location')}>
                  Camera {sortField === 'camera_location' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHeaderCell>
                <TableHeaderCell>Description</TableHeaderCell>
                <TableHeaderCell>Confidence</TableHeaderCell>
              </tr>
            </TableHeader>
            <TableBody>
              {filteredAlerts.map(alert => (
                <TableRow key={alert.id}>
                  <TableCell>{formatTimestamp(alert.timestamp)}</TableCell>
                  <TableCell>{alert.alert_type}</TableCell>
                  <TableCell>
                    <PriorityBadge priority={alert.priority}>
                      {alert.priority}
                    </PriorityBadge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={alert.status}>
                      {alert.status}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>{alert.camera_location}</TableCell>
                  <TableCell>
                    <AlertDescription>{alert.description}</AlertDescription>
                  </TableCell>
                  <TableCell>{Math.round(alert.confidence * 100)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </LogTable>
        )}
      </LogContent>
    </LogContainer>
  );
}

export default AIAlertLog;
