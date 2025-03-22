// File: frontend/src/data/mockData.tsx
import { 
  ClientData, 
  MetricsData,
  DailyReport,
  DailyReportStatus,
  SecurityCode
} from '../types/reports';

// Mock properties
export const properties = [
  { id: "prop1", name: "Downtown Office Complex", location: "123 Main St" },
  { id: "prop2", name: "Westside Mall", location: "456 Market Ave" },
  { id: "prop3", name: "Harbor Warehouse", location: "789 Harbor Rd" },
  { id: "prop4", name: "Tech Campus", location: "321 Innovation Dr" },
];

// Mock reports
export const reports = [
  {
    id: 1,
    type: "DAR", // Daily Activity Report
    propertyId: "prop1",
    date: "2023-06-01",
    guardName: "John Doe",
    incidentCount: 2,
    status: "completed",
    shiftStart: "08:00",
    shiftEnd: "16:00",
  },
  {
    id: 2,
    type: "Incident",
    propertyId: "prop1",
    date: "2023-06-01",
    guardName: "John Doe",
    incidentType: "Trespassing",
    status: "pending",
  },
  {
    id: 3,
    type: "DAR",
    propertyId: "prop2",
    date: "2023-06-02",
    guardName: "Jane Smith",
    incidentCount: 0,
    status: "completed",
    shiftStart: "16:00",
    shiftEnd: "00:00",
  },
  {
    id: 4,
    type: "Maintenance",
    propertyId: "prop3",
    date: "2023-06-03",
    guardName: "Mike Johnson",
    issueType: "Broken Lock",
    status: "in-progress",
  },
  {
    id: 5,
    type: "DAR",
    propertyId: "prop4",
    date: "2023-06-04",
    guardName: "Emily Brown",
    incidentCount: 1,
    status: "completed",
    shiftStart: "00:00",
    shiftEnd: "08:00",
  },
  {
    id: 6,
    type: "Incident",
    propertyId: "prop2",
    date: "2023-06-05",
    guardName: "Jane Smith",
    incidentType: "Vandalism",
    status: "completed",
  },
  {
    id: 7,
    type: "DAR",
    propertyId: "prop3",
    date: "2023-06-06",
    guardName: "Mike Johnson",
    incidentCount: 3,
    status: "completed",
    shiftStart: "08:00",
    shiftEnd: "16:00",
  },
  {
    id: 8,
    type: "Maintenance",
    propertyId: "prop4",
    date: "2023-06-07",
    guardName: "Emily Brown",
    issueType: "CCTV Malfunction",
    status: "pending",
  },
  {
    id: 9,
    type: "Incident",
    propertyId: "prop1",
    date: "2023-06-08",
    guardName: "John Doe",
    incidentType: "Fire Alarm",
    status: "completed",
  },
];

// Example detailed report (DAR)
export const mockDAR = {
  id: 1,
  propertyId: "prop1",
  propertyName: "Downtown Office Complex",
  date: "2023-06-01",
  guardName: "John Doe",
  shiftStart: "08:00",
  shiftEnd: "16:00",
  incidentCount: 2,
  status: "completed",
  activities: [
    { time: "08:15", description: "Conducted perimeter check. All secure." },
    {
      time: "10:30",
      description: "Responded to noise complaint on 3rd floor. False alarm.",
    },
    { time: "12:45", description: "Lunch break" },
    { time: "14:20", description: "Escorted maintenance team to server room" },
    { time: "15:45", description: "Conducted final rounds. All areas secure." },
  ],
  incidents: [
    {
      time: "11:15",
      type: "Trespassing",
      description:
        "Unauthorized individual attempted to enter through side entrance. Escorted off premises.",
    },
    {
      time: "13:30",
      type: "Medical",
      description:
        "Employee reported feeling dizzy. Called ambulance. Employee taken to hospital for check-up.",
    },
  ],
  guardNotes: "Overall a quiet day with minimal incidents.",
};

// Mock daily reports for weekly reporting
export const mockDailyReports: DailyReport[] = [
  { 
    day: 'Monday', 
    content: 'Routine patrol conducted with no significant incidents. All access points checked and secured. One visitor was escorted to the main office. Camera systems functioning properly.',
    status: 'Completed' as DailyReportStatus, 
    securityCode: 'Code 4' as SecurityCode 
  },
  { 
    day: 'Tuesday', 
    content: 'Morning patrol identified an unlocked side entrance, which was secured immediately. Two employees were assisted with access issues. Perimeter check completed at 10:00 AM and 2:00 PM.',
    status: 'Completed' as DailyReportStatus, 
    securityCode: 'Code 4' as SecurityCode 
  },
  { 
    day: 'Wednesday', 
    content: 'Responded to a fire alarm activation at 11:20 AM. False alarm confirmed with maintenance team. All systems reset by 11:45 AM. Conducted full facility check afterward.',
    status: 'Completed' as DailyReportStatus, 
    securityCode: 'Code 3' as SecurityCode 
  },
  { 
    day: 'Thursday', 
    content: 'Unidentified individual observed near the south entrance at 2:15 PM. Subject departed when approached. Incident documented and camera footage secured. All areas secure during final check.',
    status: 'In Progress' as DailyReportStatus, 
    securityCode: 'Code 3' as SecurityCode 
  },
  { 
    day: 'Friday', 
    content: 'Assisted facilities with water leak in the east wing. Area secured and maintenance notified. Weekend security briefing conducted with evening shift. All systems and access points verified.',
    status: 'To update' as DailyReportStatus, 
    securityCode: 'Code 4' as SecurityCode 
  },
  { 
    day: 'Saturday', 
    content: 'Light activity day. Perimeter checks conducted at regular intervals. One contractor escorted to server room for scheduled maintenance. All systems functioning normally.',
    status: 'Completed' as DailyReportStatus, 
    securityCode: 'Code 5' as SecurityCode 
  },
  { 
    day: 'Sunday', 
    content: 'Quiet day with minimal activity. All access points secured. System maintenance performed on camera network. Parking area patrol conducted with no incidents to report.',
    status: 'Completed' as DailyReportStatus, 
    securityCode: 'Code 5' as SecurityCode 
  },
];

export const mockClients: ClientData[] = [
  {
    id: '1',
    name: 'Riverview Apartments',
    siteName: 'Riverview Apartments',
    location: '123 Riverside Dr',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    contactEmail: 'manager@riverview.com',
    cameraType: 'Hikvision PTZ',
    cameras: 16,
    lastReportDate: '2025-03-04',
    isActive: true,
    isVIP: true,
    contacts: [
      {
        name: 'John Smith',
        email: 'jsmith@riverview.com',
        phone: '512-555-1234',
        isPrimary: true
      },
      {
        name: 'Sarah Johnson',
        email: 'sjohnson@riverview.com',
        phone: '512-555-5678',
        isPrimary: false
      }
    ],
    cameraDetails: 'High-definition PTZ cameras with night vision capability'
  },
  {
    id: '2',
    name: 'Parkside Plaza',
    siteName: 'Parkside Commercial Plaza',
    location: '456 Park Avenue',
    city: 'San Antonio',
    state: 'TX',
    zipCode: '78205',
    contactEmail: 'security@parkside.com',
    cameraType: 'Axis Fixed Dome',
    cameras: 24,
    lastReportDate: '2025-03-01',
    isActive: true,
    isNew: true,
    contacts: [
      {
        name: 'Michael Brown',
        email: 'mbrown@parkside.com',
        phone: '210-555-9876',
        isPrimary: true
      }
    ],
    cameraDetails: 'Fixed dome cameras with 4K resolution and wide-angle lenses'
  },
  {
    id: '3',
    name: 'Lakeview Condos',
    siteName: 'Lakeview Condominium Complex',
    location: '789 Lakeshore Blvd',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75201',
    contactEmail: 'admin@lakeview.com',
    cameraType: 'Dahua PTZ',
    cameras: 12,
    lastReportDate: '2025-02-28',
    isActive: true,
    contacts: [
      {
        name: 'Lisa Williams',
        email: 'lwilliams@lakeview.com',
        phone: '214-555-4321',
        isPrimary: true
      },
      {
        name: 'Robert Davis',
        email: 'rdavis@lakeview.com',
        phone: '214-555-8765',
        isPrimary: false
      }
    ],
    cameraDetails: 'Mixture of PTZ and fixed cameras with facial recognition capability'
  },
  {
    id: '4',
    name: 'Highland Towers',
    siteName: 'Highland Luxury Towers',
    location: '1010 Highland St',
    city: 'Houston',
    state: 'TX',
    zipCode: '77002',
    contactEmail: 'manager@highland.com',
    cameraType: 'Sony PTZ',
    cameras: 32,
    lastReportDate: '2025-03-02',
    isActive: true,
    isVIP: true,
    contacts: [
      {
        name: 'Thomas Wilson',
        email: 'twilson@highland.com',
        phone: '713-555-2468',
        isPrimary: true
      }
    ],
    cameraDetails: 'High-end Sony cameras with advanced motion detection and analytics'
  },
  {
    id: '5',
    name: 'Sunset Retail Center',
    siteName: 'Sunset Shopping Plaza',
    location: '2020 Sunset Blvd',
    city: 'El Paso',
    state: 'TX',
    zipCode: '79901',
    contactEmail: 'security@sunset.com',
    cameraType: 'Bosch Fixed',
    cameras: 28,
    lastReportDate: '2025-02-25',
    isActive: false,
    contacts: [
      {
        name: 'Jennifer Martinez',
        email: 'jmartinez@sunset.com',
        phone: '915-555-1357',
        isPrimary: true
      },
      {
        name: 'David Thompson',
        email: 'dthompson@sunset.com',
        phone: '915-555-7531',
        isPrimary: false
      }
    ],
    cameraDetails: 'Fixed cameras installed at all entrances, exits, and high-traffic areas'
  }
];

export const mockMetricsData: MetricsData = {
  humanIntrusions: {
    Monday: 3,
    Tuesday: 5,
    Wednesday: 2,
    Thursday: 7,
    Friday: 8,
    Saturday: 12,
    Sunday: 4
  },
  vehicleIntrusions: {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 0,
    Thursday: 3,
    Friday: 4,
    Saturday: 6,
    Sunday: 2
  },
  aiAccuracy: 97.5,
  responseTime: 0.8,
  proactiveAlerts: 5,
  potentialThreats: 2,
  operationalUptime: 99.8,
  totalMonitoringHours: 168,
  totalCameras: 16,
  camerasOnline: 16
};