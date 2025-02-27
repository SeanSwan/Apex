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