// backend/models/index.mjs
import sequelize from '../config/database.mjs';
import User from './user.mjs';
import Property from './property.mjs';
import Guard from './guard.mjs';
import Client from './client.mjs';
import Contact from './contact.mjs';
// Import the NEW vehicle-related models
import Vehicle from './vehicle.mjs';
import VehicleInspection from './vehicleInspection.mjs';
import VehicleDamage from './vehicleDamage.mjs';


// --- Existing Model Definitions and Associations ---

// User - Property (Client relationship)
User.hasMany(Property, {
  foreignKey: 'client_id',
  as: 'managedProperties',
  constraints: false,
  scope: {
    role: 'client'
  }
});
Property.belongsTo(User, {
  foreignKey: 'client_id',
  as: 'client'
});

// User - Guard (one-to-one relationship)
User.hasOne(Guard, {
  foreignKey: 'user_id',
  as: 'guardProfile',
  constraints: false // Assuming you handle constraints manually or via migration
});
Guard.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// --- Models defined directly in index.mjs ---

// PropertyAssignment model (joins Guards to Properties)
const PropertyAssignment = sequelize.define('PropertyAssignment', {
  id: {
    type: sequelize.Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  guard_id: {
    type: sequelize.Sequelize.INTEGER,
    references: {
      model: 'guards', // Refers to table name
      key: 'id'
    },
    allowNull: false
  },
  property_id: {
    type: sequelize.Sequelize.INTEGER,
    references: {
      model: 'properties', // Refers to table name
      key: 'id'
    },
    allowNull: false
  },
  start_date: {
    type: sequelize.Sequelize.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: sequelize.Sequelize.DATEONLY
  },
  primary_assignment: {
    type: sequelize.Sequelize.BOOLEAN,
    defaultValue: false
  },
  position: {
    type: sequelize.Sequelize.STRING,
    defaultValue: 'security_guard'
  },
  hours_per_week: {
    type: sequelize.Sequelize.FLOAT,
    defaultValue: 40
  },
  shift_type: {
    type: sequelize.Sequelize.STRING // day, night, evening, etc.
  },
  status: {
    type: sequelize.Sequelize.STRING,
    defaultValue: 'active',
    validate: {
      isIn: [['pending', 'active', 'completed', 'terminated']]
    }
  },
  created_at: {
    type: sequelize.Sequelize.DATE,
    defaultValue: sequelize.Sequelize.NOW
  },
  updated_at: {
    type: sequelize.Sequelize.DATE,
    defaultValue: sequelize.Sequelize.NOW
  }
}, {
  tableName: 'property_assignments',
  timestamps: true,
  underscored: true
});

// Patrol model
const Patrol = sequelize.define('Patrol', {
  id: {
    type: sequelize.Sequelize.INTEGER, // Changed to INTEGER to match potential FKs
    autoIncrement: true,
    primaryKey: true
  },
  property_id: {
    type: sequelize.Sequelize.INTEGER,
    references: {
      model: 'properties',
      key: 'id'
    },
    allowNull: false
  },
  // patrol_route_id - Consider defining PatrolRoute model separately if complex
  // guard_id referenced from association below
  patrol_number: {
      type: sequelize.Sequelize.STRING,
      unique: true, // Ensure patrol numbers are unique if used as identifiers
      allowNull: true // Allow null if not always used or generated later
  },
  patrol_type: {
      type: sequelize.Sequelize.STRING,
      defaultValue: 'regular'
  },
  description: {
      type: sequelize.Sequelize.TEXT
  },
  scheduled_at: {
      type: sequelize.Sequelize.DATE
  },
  start_time: {
    type: sequelize.Sequelize.DATE,
    // allowNull: false // Start time might not exist until patrol starts
  },
  end_time: {
    type: sequelize.Sequelize.DATE
  },
  estimated_duration_minutes: {
      type: sequelize.Sequelize.INTEGER
  },
  actual_duration_minutes: {
      type: sequelize.Sequelize.INTEGER
  },
  status: {
    type: sequelize.Sequelize.STRING,
    defaultValue: 'scheduled', // Start as scheduled
    validate: {
      isIn: [['scheduled', 'in_progress', 'completed', 'missed', 'cancelled']]
    }
  },
  started_on_time: {
      type: sequelize.Sequelize.BOOLEAN
  },
  completed_on_time: {
      type: sequelize.Sequelize.BOOLEAN
  },
  // Checkpoint related fields might belong in a separate CheckpointScan model
  // checkpoints_total, checkpoints_scanned, checkpoint_compliance, start_location, end_location, path_taken etc.
  distance_traveled: {
      type: sequelize.Sequelize.FLOAT
  },
  findings: {
      type: sequelize.Sequelize.TEXT
  },
  notes: {
    type: sequelize.Sequelize.TEXT
  },
  issues_found: {
      type: sequelize.Sequelize.BOOLEAN,
      defaultValue: false
  },
  incidents_reported: {
    type: sequelize.Sequelize.INTEGER,
    defaultValue: 0
  },
  incident_ids: { // Consider a join table PatrolIncidents if needed
      type: sequelize.Sequelize.JSONB,
      defaultValue: []
  },
  maintenance_issues: { // Consider a join table or separate Maintenance model
      type: sequelize.Sequelize.JSONB,
      defaultValue: []
  },
  photos: {
      type: sequelize.Sequelize.JSONB,
      defaultValue: []
  },
  videos: {
      type: sequelize.Sequelize.JSONB,
      defaultValue: []
  },
  weather_conditions: {
      type: sequelize.Sequelize.STRING
  },
  temperature: {
      type: sequelize.Sequelize.FLOAT
  },
  weather_details: {
      type: sequelize.Sequelize.JSONB
  },
  // supervisor_id referenced from association below
  reviewed: {
      type: sequelize.Sequelize.BOOLEAN,
      defaultValue: false
  },
  reviewed_at: {
      type: sequelize.Sequelize.DATE
  },
  // reviewed_by referenced from association below
  review_notes: {
      type: sequelize.Sequelize.TEXT
  },
  review_rating: {
      type: sequelize.Sequelize.INTEGER
  },
  billable: {
      type: sequelize.Sequelize.BOOLEAN,
      defaultValue: true
  },
  billing_code: {
      type: sequelize.Sequelize.STRING
  },
  client_visible: {
      type: sequelize.Sequelize.BOOLEAN,
      defaultValue: true
  },
  client_notified: {
      type: sequelize.Sequelize.BOOLEAN,
      defaultValue: false
  },
  client_notification_sent_at: {
      type: sequelize.Sequelize.DATE
  },
  equipment_used: {
      type: sequelize.Sequelize.JSONB,
      defaultValue: []
  },
  // vehicle_id referenced from association below
  vehicle_start_mileage: {
      type: sequelize.Sequelize.FLOAT
  },
  vehicle_end_mileage: {
      type: sequelize.Sequelize.FLOAT
  },
  created_at: {
    type: sequelize.Sequelize.DATE,
    defaultValue: sequelize.Sequelize.NOW
  },
  updated_at: {
    type: sequelize.Sequelize.DATE,
    defaultValue: sequelize.Sequelize.NOW
  },
  // Add guard_id FK directly here, simplifies relationships compared to index.mjs setup before
  guard_id: {
    type: sequelize.Sequelize.INTEGER,
    references: {
      model: 'guards',
      key: 'id'
    },
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT' // Or appropriate action
  },
  // Add supervisor_id FK
  supervisor_id: {
    type: sequelize.Sequelize.INTEGER,
    references: {
      model: 'users', // Assuming supervisors are Users
      key: 'id'
    },
    allowNull: true,
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  // Add reviewed_by FK
  reviewed_by: { // Renamed from reviewed_by_id for consistency if using underscores
    type: sequelize.Sequelize.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    allowNull: true,
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  // Add vehicle_id FK
  vehicle_id: {
    type: sequelize.Sequelize.INTEGER,
    references: {
      model: 'vehicles', // Table name
      key: 'id'
    },
    allowNull: true, // Patrol might not always use a vehicle
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  }

}, {
  tableName: 'patrols',
  timestamps: true,
  underscored: true
});


// Incident model
const Incident = sequelize.define('Incident', {
  id: {
    type: sequelize.Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  property_id: {
    type: sequelize.Sequelize.INTEGER,
    references: {
      model: 'properties',
      key: 'id'
    },
    allowNull: false
  },
  reported_by_id: {
    type: sequelize.Sequelize.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    allowNull: false
  },
  incident_time: {
    type: sequelize.Sequelize.DATE,
    allowNull: false
  },
  incident_type: {
    type: sequelize.Sequelize.STRING,
    allowNull: false,
    validate: {
      isIn: [['trespassing','vandalism','theft','violence','suspicious_activity','fire','medical','alarm','maintenance','noise_complaint','parking_violation','other']]
    }
  },
  severity: {
    type: sequelize.Sequelize.STRING,
    defaultValue: 'low',
    validate: {
      isIn: [['low', 'medium', 'high', 'critical']]
    }
  },
  location_details: {
    type: sequelize.Sequelize.STRING
  },
  description: {
    type: sequelize.Sequelize.TEXT,
    allowNull: false
  },
  action_taken: {
    type: sequelize.Sequelize.TEXT
  },
  authorities_contacted: {
    type: sequelize.Sequelize.BOOLEAN,
    defaultValue: false
  },
  authorities_report_number: {
    type: sequelize.Sequelize.STRING
  },
  witness_information: {
    type: sequelize.Sequelize.TEXT
  },
  evidence_collected: {
    type: sequelize.Sequelize.TEXT
  },
  photos: {
    type: sequelize.Sequelize.TEXT // Consider JSONB
  },
  status: {
    type: sequelize.Sequelize.STRING,
    defaultValue: 'open',
    validate: {
      isIn: [['open', 'investigating', 'resolved', 'closed', 'reopened']]
    }
  },
  resolution_notes: {
    type: sequelize.Sequelize.TEXT
  },
  resolved_at: {
    type: sequelize.Sequelize.DATE
  },
  resolved_by_id: {
    type: sequelize.Sequelize.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    allowNull: true
  },
  created_at: {
    type: sequelize.Sequelize.DATE,
    defaultValue: sequelize.Sequelize.NOW
  },
  updated_at: {
    type: sequelize.Sequelize.DATE,
    defaultValue: sequelize.Sequelize.NOW
  }
}, {
  tableName: 'incidents',
  timestamps: true,
  underscored: true
});


// DailyActivityReport model
const DailyActivityReport = sequelize.define('DailyActivityReport', {
  id: {
    type: sequelize.Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  guard_id: {
    type: sequelize.Sequelize.INTEGER,
    references: {
      model: 'guards',
      key: 'id'
    },
    allowNull: false
  },
  property_id: {
    type: sequelize.Sequelize.INTEGER,
    references: {
      model: 'properties',
      key: 'id'
    },
    allowNull: false
  },
  report_date: {
    type: sequelize.Sequelize.DATEONLY,
    allowNull: false
  },
  shift_start: {
    type: sequelize.Sequelize.DATE,
    allowNull: false
  },
  shift_end: {
    type: sequelize.Sequelize.DATE
  },
  weather_conditions: {
    type: sequelize.Sequelize.STRING
  },
  summary: {
    type: sequelize.Sequelize.TEXT,
    allowNull: false
  },
  activities: {
    type: sequelize.Sequelize.TEXT // Consider JSONB
  },
  incidents_reported: {
    type: sequelize.Sequelize.INTEGER,
    defaultValue: 0
  },
  visitors_processed: {
    type: sequelize.Sequelize.INTEGER,
    defaultValue: 0
  },
  patrols_completed: {
    type: sequelize.Sequelize.INTEGER,
    defaultValue: 0
  },
  maintenance_issues: {
    type: sequelize.Sequelize.TEXT // Consider JSONB
  },
  parking_violations: {
    type: sequelize.Sequelize.INTEGER,
    defaultValue: 0
  },
  status: {
    type: sequelize.Sequelize.STRING,
    defaultValue: 'draft',
    validate: {
      isIn: [['draft', 'submitted', 'approved', 'rejected', 'requires_revision']]
    }
  },
  approved_by_id: {
    type: sequelize.Sequelize.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    allowNull: true
  },
  approved_at: {
    type: sequelize.Sequelize.DATE
  },
  created_at: {
    type: sequelize.Sequelize.DATE,
    defaultValue: sequelize.Sequelize.NOW
  },
  updated_at: {
    type: sequelize.Sequelize.DATE,
    defaultValue: sequelize.Sequelize.NOW
  }
}, {
  tableName: 'daily_activity_reports',
  timestamps: true,
  underscored: true
});


// --- Setup Associations ---

// Guard <-> Property (Many-to-Many through PropertyAssignment)
Guard.belongsToMany(Property, {
  through: PropertyAssignment,
  foreignKey: 'guard_id',
  otherKey: 'property_id',
  as: 'assignedProperties'
});
Property.belongsToMany(Guard, {
  through: PropertyAssignment,
  foreignKey: 'property_id',
  otherKey: 'guard_id',
  as: 'assignedGuards'
});

// Guard <-> Patrol (One-to-Many)
Guard.hasMany(Patrol, {
  foreignKey: 'guard_id', // Corresponds to FK in Patrol definition
  as: 'patrols'
});
Patrol.belongsTo(Guard, {
  foreignKey: 'guard_id',
  as: 'guard'
});

// Property <-> Patrol (One-to-Many)
Property.hasMany(Patrol, {
  foreignKey: 'property_id', // Corresponds to FK in Patrol definition
  as: 'patrols'
});
Patrol.belongsTo(Property, {
  foreignKey: 'property_id',
  as: 'property'
});

// User (Supervisor) <-> Patrol (One-to-Many)
User.hasMany(Patrol, {
  foreignKey: 'supervisor_id', // Corresponds to FK in Patrol definition
  as: 'supervisedPatrols'
});
Patrol.belongsTo(User, {
  foreignKey: 'supervisor_id',
  as: 'supervisor'
});

// User (Reviewer) <-> Patrol (One-to-Many)
User.hasMany(Patrol, {
  foreignKey: 'reviewed_by', // Corresponds to FK in Patrol definition
  as: 'reviewedPatrols'
});
Patrol.belongsTo(User, {
  foreignKey: 'reviewed_by',
  as: 'reviewer'
});


// Property <-> Incident (One-to-Many)
Property.hasMany(Incident, {
  foreignKey: 'property_id',
  as: 'incidents'
});
Incident.belongsTo(Property, {
  foreignKey: 'property_id',
  as: 'property'
});

// User <-> Incident (Reported By - One-to-Many)
User.hasMany(Incident, {
  foreignKey: 'reported_by_id',
  as: 'reportedIncidents'
});
Incident.belongsTo(User, {
  foreignKey: 'reported_by_id',
  as: 'reportedBy'
});

// User <-> Incident (Resolved By - One-to-Many)
User.hasMany(Incident, {
  foreignKey: 'resolved_by_id',
  as: 'resolvedIncidents'
});
Incident.belongsTo(User, {
  foreignKey: 'resolved_by_id',
  as: 'resolvedBy'
});

// Guard <-> DailyActivityReport (One-to-Many)
Guard.hasMany(DailyActivityReport, {
  foreignKey: 'guard_id',
  as: 'dailyReports'
});
DailyActivityReport.belongsTo(Guard, {
  foreignKey: 'guard_id',
  as: 'guard'
});

// Property <-> DailyActivityReport (One-to-Many)
Property.hasMany(DailyActivityReport, {
  foreignKey: 'property_id',
  as: 'dailyReports'
});
DailyActivityReport.belongsTo(Property, {
  foreignKey: 'property_id',
  as: 'property'
});

// User <-> DailyActivityReport (Approved By - One-to-Many)
User.hasMany(DailyActivityReport, {
  foreignKey: 'approved_by_id',
  as: 'approvedReports'
});
DailyActivityReport.belongsTo(User, {
  foreignKey: 'approved_by_id',
  as: 'approvedBy'
});

// Client <-> Contact (One-to-Many)
Client.hasMany(Contact, {
  foreignKey: 'clientId', // Use camelCase FK name defined in Contact model
  as: 'contacts',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Contact.belongsTo(Client, {
  foreignKey: 'clientId',
  as: 'client'
});

// --- NEW Vehicle Associations ---

// Vehicle <-> Guard (Current Driver - One-to-Many, potentially One-to-One if only one car per driver at a time)
// If a guard can only drive one vehicle at a time, a One-to-One might be better modeled with hasOne/belongsTo
// Let's assume a guard *could* be associated with multiple vehicles over time, but only drives one *now*.
// The FK is on the Vehicle table ('current_driver_guard_id')
Guard.hasMany(Vehicle, { // A Guard might use different vehicles over time
    foreignKey: 'current_driver_guard_id', // Corresponds to FK in Vehicle model
    as: 'drivenVehicles' // Alias for vehicles driven by this guard
});
Vehicle.belongsTo(Guard, {
    foreignKey: 'current_driver_guard_id',
    as: 'currentDriver' // Alias to get the current driver of the vehicle
});

// Vehicle <-> VehicleInspection (One-to-Many)
Vehicle.hasMany(VehicleInspection, {
    foreignKey: 'vehicleId', // Use camelCase FK name from VehicleInspection model
    as: 'inspections',
    onDelete: 'CASCADE' // Delete inspections if vehicle is deleted
});
VehicleInspection.belongsTo(Vehicle, {
    foreignKey: 'vehicleId',
    as: 'vehicle'
});

// Guard <-> VehicleInspection (Inspector - One-to-Many)
Guard.hasMany(VehicleInspection, {
    foreignKey: 'inspectedByGuardId', // Use camelCase FK name from VehicleInspection model
    as: 'inspectionsPerformed'
});
VehicleInspection.belongsTo(Guard, {
    foreignKey: 'inspectedByGuardId',
    as: 'inspector'
});

// Vehicle <-> VehicleDamage (One-to-Many)
Vehicle.hasMany(VehicleDamage, {
    foreignKey: 'vehicleId', // Use camelCase FK name from VehicleDamage model
    as: 'damages',
    onDelete: 'CASCADE' // Delete damage reports if vehicle is deleted
});
VehicleDamage.belongsTo(Vehicle, {
    foreignKey: 'vehicleId',
    as: 'vehicle'
});

// Guard <-> VehicleDamage (Reporter - One-to-Many)
Guard.hasMany(VehicleDamage, {
    foreignKey: 'reportedByGuardId', // Use camelCase FK name from VehicleDamage model
    as: 'reportedDamages'
});
VehicleDamage.belongsTo(Guard, {
    foreignKey: 'reportedByGuardId',
    as: 'reporter'
});

// Incident <-> VehicleDamage (Optional Link - One-to-Many)
Incident.hasMany(VehicleDamage, {
    foreignKey: 'incidentId', // Use camelCase FK name from VehicleDamage model
    as: 'relatedVehicleDamages',
    constraints: false // Often optional links don't need strict DB constraints
});
VehicleDamage.belongsTo(Incident, {
    foreignKey: 'incidentId',
    as: 'relatedIncident'
});

// VehicleInspection <-> VehicleDamage (Optional Link - One-to-Many)
VehicleInspection.hasMany(VehicleDamage, {
    foreignKey: 'inspectionId', // Use camelCase FK name from VehicleDamage model
    as: 'damagesFound',
    constraints: false
});
VehicleDamage.belongsTo(VehicleInspection, {
    foreignKey: 'inspectionId',
    as: 'originatingInspection'
});

// Vehicle <-> Patrol (One-to-Many)
Vehicle.hasMany(Patrol, {
    foreignKey: 'vehicle_id', // Matches FK defined directly in Patrol definition
    as: 'patrols'
});
Patrol.belongsTo(Vehicle, {
    foreignKey: 'vehicle_id',
    as: 'vehicle'
});


// --- Export Models ---

const db = {
  sequelize,
  Sequelize: sequelize.Sequelize,
  User,
  Property,
  Guard,
  PropertyAssignment,
  Patrol,
  Incident,
  DailyActivityReport,
  Client,
  Contact,
  // Add the NEW models to the export
  Vehicle,
  VehicleInspection,
  VehicleDamage
};

// Test database connection on import
const testDbConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection in models/index.mjs established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database from models/index.mjs:', error.message);
  }
};

// Run the test but don't block the import (optional)
testDbConnection();

export default db;