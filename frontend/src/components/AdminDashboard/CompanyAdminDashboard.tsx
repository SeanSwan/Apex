// APEX AI COMPANY ADMIN DASHBOARD
// Master Prompt v29.1-APEX Implementation
// Phase 2B: Company Admin Dashboard (CEO, CFO, Operations Manager, Account Managers)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import { 
  Shield, 
  Users, 
  Building, 
  Calendar, 
  DollarSign, 
  Clock, 
  BarChart3, 
  FileText, 
  Settings,
  Plus,
  Edit,
  Search,
  Download,
  UserPlus,
  MapPin,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  MonitorSpeaker,
  Eye
} from 'lucide-react';

// Import existing components
import { useToast } from '../../hooks/use-toast';
import { Button } from '../ui/button';

// Types for Admin Dashboard
interface User {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'admin_ceo' | 'admin_cfo' | 'admin_cto' | 'manager' | 'dispatcher' | 'guard' | 'account_manager';
  status: 'active' | 'inactive' | 'suspended';
  last_login: string;
  created_at: string;
  permissions: string[];
}

interface Client {
  client_id: string;
  name: string;
  type: 'luxury_apartment' | 'commercial' | 'residential' | 'corporate';
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  contract_start: string;
  contract_end: string;
  monthly_value: number;
  status: 'active' | 'pending' | 'inactive';
  properties: Property[];
  account_manager: string;
}

interface PatrolRoute {
  route_id: string;
  name: string;
  checkpoints: string[];
  estimated_duration: number;
  active: boolean;
}

interface Property {
  property_id: string;
  client_id: string;
  name: string;
  address: string;
  guard_posts: GuardPost[];
  cameras: CameraSystem[];
  patrol_routes: PatrolRoute[];
  service_level: 'basic' | 'standard' | 'premium' | 'ai_enhanced';
  monthly_hours: number;
}

interface GuardPost {
  post_id: string;
  name: string;
  location: string;
  shift_schedule: string;
  requirements: string[];
  current_guard?: string;
  status: 'occupied' | 'vacant' | 'offline';
}

interface CameraSystem {
  camera_id: string;
  name: string;
  location: string;
  rtsp_url: string;
  ai_enabled: boolean;
  status: 'online' | 'offline' | 'maintenance';
}

interface GuardEmployee {
  guard_id: string;
  name: string;
  employee_id: string;
  email: string;
  phone: string;
  certifications: string[];
  availability: string[];
  hourly_rate: number;
  status: 'active' | 'on_leave' | 'terminated';
  hire_date: string;
  assigned_properties: string[];
  performance_rating: number;
}

interface Shift {
  shift_id: string;
  guard_id: string;
  property_id: string;
  post_id: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'active' | 'completed' | 'missed';
  notes?: string;
}

interface AnalyticsData {
  period: string;
  revenue: number;
  active_guards: number;
  properties_served: number;
  incidents_handled: number;
  client_satisfaction: number;
  ai_detections: number;
  response_time_avg: number;
}

// Styled Components
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Inter', sans-serif;
    background-color: #0a0a0a;
    color: #ffffff;
    overflow: hidden;
  }
`;

const DashboardContainer = styled.div`
  display: grid;
  grid-template-rows: 60px 1fr;
  height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  background: rgba(20, 20, 20, 0.95);
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  backdrop-filter: blur(10px);
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #FFD700;
    margin: 0;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
  
  .role-badge {
    padding: 0.25rem 0.75rem;
    background: rgba(255, 215, 0, 0.2);
    border: 1px solid rgba(255, 215, 0, 0.5);
    border-radius: 12px;
    color: #FFD700;
    font-weight: 500;
  }
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 250px 1fr;
  height: calc(100vh - 60px);
  overflow: hidden;
`;

const Sidebar = styled.div`
  background: rgba(20, 20, 20, 0.9);
  border-right: 1px solid rgba(255, 215, 0, 0.3);
  overflow-y: auto;
  padding: 1rem 0;
`;

const SidebarSection = styled.div`
  margin-bottom: 2rem;
  
  h3 {
    color: #FFD700;
    font-size: 0.9rem;
    margin: 0 1rem 1rem 1rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const SidebarItem = styled.button<{ active: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: ${props => props.active ? 'rgba(255, 215, 0, 0.1)' : 'transparent'};
  border: none;
  border-left: 3px solid ${props => props.active ? '#FFD700' : 'transparent'};
  color: ${props => props.active ? '#FFD700' : '#B0B0B0'};
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-size: 0.9rem;
  
  &:hover {
    background: rgba(255, 215, 0, 0.05);
    color: #FFD700;
  }
`;

const ContentArea = styled.div`
  overflow-y: auto;
  padding: 2rem;
  background: rgba(10, 10, 10, 0.5);
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  
  h2 {
    margin: 0;
    color: #FFD700;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.5rem;
  }
  
  .actions {
    display: flex;
    gap: 1rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div<{ variant?: 'success' | 'warning' | 'danger' | 'info' }>`
  background: rgba(30, 30, 30, 0.9);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid ${props => {
    switch(props.variant) {
      case 'success': return 'rgba(34, 197, 94, 0.3)';
      case 'warning': return 'rgba(245, 158, 11, 0.3)';
      case 'danger': return 'rgba(239, 68, 68, 0.3)';
      default: return 'rgba(255, 215, 0, 0.3)';
    }
  }};
  
  .stat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    
    .icon {
      padding: 0.5rem;
      border-radius: 8px;
      background: ${props => {
        switch(props.variant) {
          case 'success': return 'rgba(34, 197, 94, 0.2)';
          case 'warning': return 'rgba(245, 158, 11, 0.2)';
          case 'danger': return 'rgba(239, 68, 68, 0.2)';
          default: return 'rgba(255, 215, 0, 0.2)';
        }
      }};
      color: ${props => {
        switch(props.variant) {
          case 'success': return '#22C55E';
          case 'warning': return '#F59E0B';
          case 'danger': return '#EF4444';
          default: return '#FFD700';
        }
      }};
    }
    
    .trend {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8rem;
      color: ${props => {
        switch(props.variant) {
          case 'success': return '#22C55E';
          case 'warning': return '#F59E0B';
          case 'danger': return '#EF4444';
          default: return '#3B82F6';
        }
      }};
    }
  }
  
  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #E0E0E0;
    margin-bottom: 0.25rem;
  }
  
  .stat-label {
    color: #B0B0B0;
    font-size: 0.9rem;
  }
`;

const DataTable = styled.div`
  background: rgba(30, 30, 30, 0.9);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  overflow: hidden;
`;

const TableHeader = styled.div`
  padding: 1rem 1.5rem;
  background: rgba(255, 215, 0, 0.1);
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    margin: 0;
    color: #FFD700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .table-actions {
    display: flex;
    gap: 0.5rem;
  }
`;

const TableControls = styled.div`
  padding: 1rem 1.5rem;
  background: rgba(20, 20, 20, 0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 1rem;
  align-items: center;
  
  .search-box {
    flex: 1;
    max-width: 300px;
    position: relative;
    
    input {
      width: 100%;
      padding: 0.5rem 1rem 0.5rem 2.5rem;
      background: rgba(40, 40, 40, 0.9);
      border: 1px solid rgba(255, 215, 0, 0.3);
      border-radius: 6px;
      color: #E0E0E0;
      font-size: 0.9rem;
      
      &::placeholder {
        color: #666;
      }
    }
    
    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
    }
  }
  
  .filter-controls {
    display: flex;
    gap: 0.5rem;
    
    select {
      padding: 0.5rem;
      background: rgba(40, 40, 40, 0.9);
      border: 1px solid rgba(255, 215, 0, 0.3);
      border-radius: 6px;
      color: #E0E0E0;
      font-size: 0.9rem;
    }
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 1rem 1.5rem;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  th {
    background: rgba(40, 40, 40, 0.5);
    color: #FFD700;
    font-weight: 600;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  td {
    color: #E0E0E0;
    font-size: 0.9rem;
    
    &:last-child {
      text-align: right;
    }
  }
  
  tbody tr {
    transition: background-color 0.2s ease;
    
    &:hover {
      background: rgba(255, 215, 0, 0.05);
    }
  }
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  background: ${props => {
    switch(props.status) {
      case 'active':
      case 'online':
      case 'completed': return 'rgba(34, 197, 94, 0.2)';
      case 'pending':
      case 'scheduled': return 'rgba(245, 158, 11, 0.2)';
      case 'inactive':
      case 'offline':
      case 'terminated': return 'rgba(239, 68, 68, 0.2)';
      case 'suspended':
      case 'maintenance': return 'rgba(107, 114, 128, 0.2)';
      default: return 'rgba(59, 130, 246, 0.2)';
    }
  }};
  
  color: ${props => {
    switch(props.status) {
      case 'active':
      case 'online':
      case 'completed': return '#22C55E';
      case 'pending':
      case 'scheduled': return '#F59E0B';
      case 'inactive':
      case 'offline':
      case 'terminated': return '#EF4444';
      case 'suspended':
      case 'maintenance': return '#9CA3AF';
      default: return '#3B82F6';
    }
  }};
  
  border: 1px solid ${props => {
    switch(props.status) {
      case 'active':
      case 'online':
      case 'completed': return 'rgba(34, 197, 94, 0.5)';
      case 'pending':
      case 'scheduled': return 'rgba(245, 158, 11, 0.5)';
      case 'inactive':
      case 'offline':
      case 'terminated': return 'rgba(239, 68, 68, 0.5)';
      case 'suspended':
      case 'maintenance': return 'rgba(107, 114, 128, 0.5)';
      default: return 'rgba(59, 130, 246, 0.5)';
    }
  }};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  
  button {
    padding: 0.4rem 0.8rem;
    border: none;
    border-radius: 6px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    
    &.edit {
      background: rgba(59, 130, 246, 0.2);
      color: #3B82F6;
      border: 1px solid rgba(59, 130, 246, 0.3);
      
      &:hover {
        background: rgba(59, 130, 246, 0.3);
      }
    }
    
    &.delete {
      background: rgba(239, 68, 68, 0.2);
      color: #EF4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
      
      &:hover {
        background: rgba(239, 68, 68, 0.3);
      }
    }
    
    &.view {
      background: rgba(34, 197, 94, 0.2);
      color: #22C55E;
      border: 1px solid rgba(34, 197, 94, 0.3);
      
      &:hover {
        background: rgba(34, 197, 94, 0.3);
      }
    }
  }
`;

// Main Component
const CompanyAdminDashboard: React.FC = () => {
  const { toast } = useToast();
  
  // State management
  const [activeSection, setActiveSection] = useState('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [guards, setGuards] = useState<GuardEmployee[]>([]);
  const [shifts] = useState<Shift[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Initialize demo data
  useEffect(() => {
    // Demo analytics
    setAnalytics({
      period: 'Current Month',
      revenue: 125000,
      active_guards: 24,
      properties_served: 12,
      incidents_handled: 45,
      client_satisfaction: 4.7,
      ai_detections: 1280,
      response_time_avg: 3.2
    });

    // Demo users
    setUsers([
      {
        user_id: 'user_001',
        name: 'John Smith',
        email: 'john.smith@apexai.com',
        phone: '+1-555-0001',
        role: 'admin_ceo',
        status: 'active',
        last_login: new Date().toISOString(),
        created_at: '2024-01-15',
        permissions: ['all']
      },
      {
        user_id: 'user_002',
        name: 'Sarah Johnson',
        email: 'sarah.j@apexai.com',
        phone: '+1-555-0002',
        role: 'manager',
        status: 'active',
        last_login: new Date(Date.now() - 3600000).toISOString(),
        created_at: '2024-02-01',
        permissions: ['operations', 'scheduling', 'reports']
      },
      {
        user_id: 'user_003',
        name: 'Mike Chen',
        email: 'mike.chen@apexai.com',
        phone: '+1-555-0003',
        role: 'dispatcher',
        status: 'active',
        last_login: new Date(Date.now() - 1800000).toISOString(),
        created_at: '2024-03-10',
        permissions: ['dispatch', 'communications']
      }
    ]);

    // Demo clients
    setClients([
      {
        client_id: 'client_001',
        name: 'Luxury Heights Apartments',
        type: 'luxury_apartment',
        contact_name: 'Robert Thompson',
        contact_email: 'robert@luxuryheights.com',
        contact_phone: '+1-555-1001',
        address: '123 Luxury Ave, Manhattan, NY 10001',
        contract_start: '2024-01-01',
        contract_end: '2025-01-01',
        monthly_value: 45000,
        status: 'active',
        properties: [],
        account_manager: 'user_002'
      },
      {
        client_id: 'client_002',
        name: 'Metropolitan Business Center',
        type: 'commercial',
        contact_name: 'Lisa Williams',
        contact_email: 'lisa@metrobiz.com',
        contact_phone: '+1-555-1002',
        address: '456 Business Blvd, Manhattan, NY 10002',
        contract_start: '2024-03-01',
        contract_end: '2025-03-01',
        monthly_value: 32000,
        status: 'active',
        properties: [],
        account_manager: 'user_002'
      }
    ]);

    // Demo guards
    setGuards([
      {
        guard_id: 'guard_001',
        name: 'Marcus Johnson',
        employee_id: 'EMP001',
        email: 'marcus.j@guards.com',
        phone: '+1-555-2001',
        certifications: ['Security License', 'CPR', 'First Aid'],
        availability: ['Mon-Fri', 'Day Shift'],
        hourly_rate: 22.00,
        status: 'active',
        hire_date: '2023-06-15',
        assigned_properties: ['prop_001', 'prop_002'],
        performance_rating: 4.8
      },
      {
        guard_id: 'guard_002',
        name: 'Sarah Williams',
        employee_id: 'EMP002',
        email: 'sarah.w@guards.com',
        phone: '+1-555-2002',
        certifications: ['Security License', 'Firearms', 'CPR'],
        availability: ['7 Days', 'Night Shift'],
        hourly_rate: 25.00,
        status: 'active',
        hire_date: '2023-08-20',
        assigned_properties: ['prop_003'],
        performance_rating: 4.9
      }
    ]);

    // Demo shifts
    setShifts([
      {
        shift_id: 'shift_001',
        guard_id: 'guard_001',
        property_id: 'prop_001',
        post_id: 'post_001',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 28800000).toISOString(),
        status: 'active',
        notes: 'Regular day shift'
      },
      {
        shift_id: 'shift_002',
        guard_id: 'guard_002',
        property_id: 'prop_002',
        post_id: 'post_002',
        start_time: new Date(Date.now() + 3600000).toISOString(),
        end_time: new Date(Date.now() + 32400000).toISOString(),
        status: 'scheduled'
      }
    ]);
  }, []);

  // Event handlers
  const handleCreateUser = useCallback(() => {
    toast({
      title: "Create User",
      description: "User creation form would open here.",
      variant: "default"
    });
  }, [toast]);

  const handleEditUser = useCallback((userId: string) => {
    toast({
      title: "Edit User",
      description: `Edit form for user ${userId} would open here.`,
      variant: "default"
    });
  }, [toast]);

  const handleCreateClient = useCallback(() => {
    toast({
      title: "Create Client",
      description: "Client creation form would open here.",
      variant: "default"
    });
  }, [toast]);

  const handleExportData = useCallback(() => {
    toast({
      title: "Export Data",
      description: "Data export initiated for current view.",
      variant: "default"
    });
  }, [toast]);

  // Filtered data
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || user.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [users, searchTerm, filterStatus]);

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.contact_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || client.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [clients, searchTerm, filterStatus]);

  const filteredGuards = useMemo(() => {
    return guards.filter(guard => {
      const matchesSearch = guard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           guard.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || guard.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [guards, searchTerm, filterStatus]);

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3, section: 'Dashboard' },
    { id: 'users', label: 'User Management', icon: Users, section: 'Administration' },
    { id: 'clients', label: 'Client Management', icon: Building, section: 'Administration' },
    { id: 'properties', label: 'Properties', icon: MapPin, section: 'Administration' },
    { id: 'guards', label: 'Guard Management', icon: Shield, section: 'Operations' },
    { id: 'scheduling', label: 'Scheduling', icon: Calendar, section: 'Operations' },
    { id: 'timeclock', label: 'Time Clock', icon: Clock, section: 'Operations' },
    { id: 'payroll', label: 'Payroll', icon: DollarSign, section: 'Finance' },
    { id: 'billing', label: 'Client Billing', icon: FileText, section: 'Finance' },
    { id: 'incidents', label: 'Incident Reports', icon: AlertTriangle, section: 'Security' },
    { id: 'ai_console', label: 'AI Console', icon: MonitorSpeaker, section: 'Technology' },
    { id: 'settings', label: 'System Settings', icon: Settings, section: 'Administration' }
  ];

  const groupedSidebarItems = useMemo(() => {
    const groups: Record<string, typeof sidebarItems> = {};
    sidebarItems.forEach(item => {
      if (!groups[item.section]) {
        groups[item.section] = [];
      }
      groups[item.section].push(item);
    });
    return groups;
  }, []);

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div>
            <PageHeader>
              <h2>
                <BarChart3 size={24} />
                Company Overview
              </h2>
              <div className="actions">
                <Button variant="outline" onClick={handleExportData}>
                  <Download size={16} />
                  Export Report
                </Button>
              </div>
            </PageHeader>

            <StatsGrid>
              <StatCard variant="success">
                <div className="stat-header">
                  <div className="icon">
                    <DollarSign size={20} />
                  </div>
                  <div className="trend">
                    <TrendingUp size={14} />
                    +12%
                  </div>
                </div>
                <div className="stat-value">${analytics?.revenue.toLocaleString()}</div>
                <div className="stat-label">Monthly Revenue</div>
              </StatCard>

              <StatCard variant="info">
                <div className="stat-header">
                  <div className="icon">
                    <Users size={20} />
                  </div>
                  <div className="trend">
                    <TrendingUp size={14} />
                    +3
                  </div>
                </div>
                <div className="stat-value">{analytics?.active_guards}</div>
                <div className="stat-label">Active Guards</div>
              </StatCard>

              <StatCard variant="info">
                <div className="stat-header">
                  <div className="icon">
                    <Building size={20} />
                  </div>
                  <div className="trend">
                    <TrendingUp size={14} />
                    +1
                  </div>
                </div>
                <div className="stat-value">{analytics?.properties_served}</div>
                <div className="stat-label">Properties Served</div>
              </StatCard>

              <StatCard variant="warning">
                <div className="stat-header">
                  <div className="icon">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="trend">
                    <TrendingDown size={14} />
                    -8%
                  </div>
                </div>
                <div className="stat-value">{analytics?.incidents_handled}</div>
                <div className="stat-label">Incidents Handled</div>
              </StatCard>

              <StatCard variant="success">
                <div className="stat-header">
                  <div className="icon">
                    <Target size={20} />
                  </div>
                  <div className="trend">
                    <TrendingUp size={14} />
                    +0.2
                  </div>
                </div>
                <div className="stat-value">{analytics?.client_satisfaction}/5.0</div>
                <div className="stat-label">Client Satisfaction</div>
              </StatCard>

              <StatCard variant="info">
                <div className="stat-header">
                  <div className="icon">
                    <Activity size={20} />
                  </div>
                  <div className="trend">
                    <TrendingUp size={14} />
                    +15%
                  </div>
                </div>
                <div className="stat-value">{analytics?.ai_detections.toLocaleString()}</div>
                <div className="stat-label">AI Detections</div>
              </StatCard>
            </StatsGrid>

            {/* Add more overview content here */}
          </div>
        );

      case 'users':
        return (
          <div>
            <PageHeader>
              <h2>
                <Users size={24} />
                User Management
              </h2>
              <div className="actions">
                <Button variant="outline" onClick={handleCreateUser}>
                  <UserPlus size={16} />
                  Add User
                </Button>
                <Button variant="outline" onClick={handleExportData}>
                  <Download size={16} />
                  Export
                </Button>
              </div>
            </PageHeader>

            <DataTable>
              <TableHeader>
                <h3>
                  <Users size={18} />
                  System Users ({filteredUsers.length})
                </h3>
              </TableHeader>

              <TableControls>
                <div className="search-box">
                  <Search className="search-icon" size={16} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="filter-controls">
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </TableControls>

              <Table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.user_id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600 }}>{user.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#B0B0B0' }}>{user.phone}</div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span style={{ textTransform: 'capitalize' }}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={user.status}>{user.status}</StatusBadge>
                      </td>
                      <td>{new Date(user.last_login).toLocaleDateString()}</td>
                      <td>
                        <ActionButtons>
                          <button className="edit" onClick={() => handleEditUser(user.user_id)}>
                            <Edit size={12} />
                            Edit
                          </button>
                          <button className="view">
                            <Eye size={12} />
                            View
                          </button>
                        </ActionButtons>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </DataTable>
          </div>
        );

      case 'clients':
        return (
          <div>
            <PageHeader>
              <h2>
                <Building size={24} />
                Client Management
              </h2>
              <div className="actions">
                <Button variant="outline" onClick={handleCreateClient}>
                  <Plus size={16} />
                  Add Client
                </Button>
                <Button variant="outline" onClick={handleExportData}>
                  <Download size={16} />
                  Export
                </Button>
              </div>
            </PageHeader>

            <DataTable>
              <TableHeader>
                <h3>
                  <Building size={18} />
                  Active Clients ({filteredClients.length})
                </h3>
              </TableHeader>

              <TableControls>
                <div className="search-box">
                  <Search className="search-icon" size={16} />
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="filter-controls">
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </TableControls>

              <Table>
                <thead>
                  <tr>
                    <th>Client Name</th>
                    <th>Contact</th>
                    <th>Type</th>
                    <th>Monthly Value</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.client_id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600 }}>{client.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#B0B0B0' }}>{client.address}</div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>{client.contact_name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#B0B0B0' }}>{client.contact_email}</div>
                        </div>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>
                        {client.type.replace('_', ' ')}
                      </td>
                      <td style={{ fontWeight: 600, color: '#22C55E' }}>
                        ${client.monthly_value.toLocaleString()}
                      </td>
                      <td>
                        <StatusBadge status={client.status}>{client.status}</StatusBadge>
                      </td>
                      <td>
                        <ActionButtons>
                          <button className="edit">
                            <Edit size={12} />
                            Edit
                          </button>
                          <button className="view">
                            <Eye size={12} />
                            View
                          </button>
                        </ActionButtons>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </DataTable>
          </div>
        );

      case 'guards':
        return (
          <div>
            <PageHeader>
              <h2>
                <Shield size={24} />
                Guard Management
              </h2>
              <div className="actions">
                <Button variant="outline">
                  <UserPlus size={16} />
                  Hire Guard
                </Button>
                <Button variant="outline" onClick={handleExportData}>
                  <Download size={16} />
                  Export
                </Button>
              </div>
            </PageHeader>

            <DataTable>
              <TableHeader>
                <h3>
                  <Shield size={18} />
                  Guard Employees ({filteredGuards.length})
                </h3>
              </TableHeader>

              <TableControls>
                <div className="search-box">
                  <Search className="search-icon" size={16} />
                  <input
                    type="text"
                    placeholder="Search guards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="filter-controls">
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </TableControls>

              <Table>
                <thead>
                  <tr>
                    <th>Guard</th>
                    <th>Employee ID</th>
                    <th>Hourly Rate</th>
                    <th>Performance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuards.map((guard) => (
                    <tr key={guard.guard_id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600 }}>{guard.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#B0B0B0' }}>
                            {guard.certifications.join(', ')}
                          </div>
                        </div>
                      </td>
                      <td>{guard.employee_id}</td>
                      <td style={{ fontWeight: 600, color: '#22C55E' }}>
                        ${guard.hourly_rate.toFixed(2)}/hr
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ 
                            width: '40px', 
                            height: '6px', 
                            background: 'rgba(255,255,255,0.1)', 
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{ 
                              width: `${(guard.performance_rating / 5) * 100}%`, 
                              height: '100%', 
                              background: '#22C55E' 
                            }} />
                          </div>
                          <span style={{ fontSize: '0.8rem' }}>{guard.performance_rating}/5</span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={guard.status}>{guard.status}</StatusBadge>
                      </td>
                      <td>
                        <ActionButtons>
                          <button className="edit">
                            <Edit size={12} />
                            Edit
                          </button>
                          <button className="view">
                            <Eye size={12} />
                            Schedule
                          </button>
                        </ActionButtons>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </DataTable>
          </div>
        );

      default:
        return (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>
            <h3>Feature Coming Soon</h3>
            <p>This section is under development.</p>
          </div>
        );
    }
  };

  return (
    <ThemeProvider theme={{}}>
      <GlobalStyle />
      <DashboardContainer>
        {/* Top Navigation Bar */}
        <TopBar>
          <LogoSection>
            <Shield size={24} color="#FFD700" />
            <h1>Apex AI Admin</h1>
          </LogoSection>
          
          <UserInfo>
            <span>Welcome, Admin User</span>
            <div className="role-badge">Super Admin</div>
          </UserInfo>
        </TopBar>

        {/* Main Content */}
        <MainContent>
          {/* Sidebar Navigation */}
          <Sidebar>
            {Object.entries(groupedSidebarItems).map(([section, items]) => (
              <SidebarSection key={section}>
                <h3>{section}</h3>
                {items.map((item) => (
                  <SidebarItem
                    key={item.id}
                    active={activeSection === item.id}
                    onClick={() => setActiveSection(item.id)}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </SidebarItem>
                ))}
              </SidebarSection>
            ))}
          </Sidebar>

          {/* Content Area */}
          <ContentArea>
            {renderContent()}
          </ContentArea>
        </MainContent>
      </DashboardContainer>
    </ThemeProvider>
  );
};

export default CompanyAdminDashboard;