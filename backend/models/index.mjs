// backend/models/index.mjs
import sequelize from '../config/database.mjs';
import User from './user.mjs';  // Fixed capitalization to match actual file
import Property from './property.mjs';
import Guard from './guard.mjs';

// Define model associations

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
  constraints: false
});
Guard.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Define additional models for relationships

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

// Set up the many-to-many relationship
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

// Patrol model to track security rounds
const Patrol = sequelize.define('Patrol', {
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
  guard_id: {
    type: sequelize.Sequelize.INTEGER,
    references: {
      model: 'guards',
      key: 'id'
    },
    allowNull: false
  },
  start_time: {
    type: sequelize.Sequelize.DATE,
    allowNull: false
  },
  end_time: {
    type: sequelize.Sequelize.DATE
  },
  status: {
    type: sequelize.Sequelize.STRING,
    defaultValue: 'in_progress',
    validate: {
      isIn: [['scheduled', 'in_progress', 'completed', 'missed', 'cancelled']]
    }
  },
  route_completed: {
    type: sequelize.Sequelize.BOOLEAN,
    defaultValue: false
  },
  notes: {
    type: sequelize.Sequelize.TEXT
  },
  incidents_reported: {
    type: sequelize.Sequelize.INTEGER,
    defaultValue: 0
  },
  checkpoint_data: {
    type: sequelize.Sequelize.TEXT // JSON string of checkpoint scans
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
  tableName: 'patrols',
  timestamps: true,
  underscored: true
});

// Set up relationships for Patrol
Guard.hasMany(Patrol, {
  foreignKey: 'guard_id',
  as: 'patrols'
});
Patrol.belongsTo(Guard, {
  foreignKey: 'guard_id',
  as: 'guard'
});

Property.hasMany(Patrol, {
  foreignKey: 'property_id',
  as: 'patrols'
});
Patrol.belongsTo(Property, {
  foreignKey: 'property_id',
  as: 'property'
});

// Incident model to track security incidents
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
      isIn: [
        [
          'trespassing', 
          'vandalism', 
          'theft', 
          'violence', 
          'suspicious_activity',
          'fire', 
          'medical', 
          'alarm', 
          'maintenance',
          'noise_complaint',
          'parking_violation',
          'other'
        ]
      ]
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
    type: sequelize.Sequelize.TEXT // JSON array of photo URLs
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
  tableName: 'incidents',
  timestamps: true,
  underscored: true
});

// Set up relationships for Incident
Property.hasMany(Incident, {
  foreignKey: 'property_id',
  as: 'incidents'
});
Incident.belongsTo(Property, {
  foreignKey: 'property_id',
  as: 'property'
});

User.hasMany(Incident, {
  foreignKey: 'reported_by_id',
  as: 'reportedIncidents'
});
Incident.belongsTo(User, {
  foreignKey: 'reported_by_id',
  as: 'reportedBy'
});

User.hasMany(Incident, {
  foreignKey: 'resolved_by_id',
  as: 'resolvedIncidents'
});
Incident.belongsTo(User, {
  foreignKey: 'resolved_by_id',
  as: 'resolvedBy'
});

// DailyActivityReport model for guard reporting
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
    type: sequelize.Sequelize.TEXT // JSON array of activities
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
    type: sequelize.Sequelize.TEXT
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
    }
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

// Set up relationships for DailyActivityReport
Guard.hasMany(DailyActivityReport, {
  foreignKey: 'guard_id',
  as: 'dailyReports'
});
DailyActivityReport.belongsTo(Guard, {
  foreignKey: 'guard_id',
  as: 'guard'
});

Property.hasMany(DailyActivityReport, {
  foreignKey: 'property_id',
  as: 'dailyReports'
});
DailyActivityReport.belongsTo(Property, {
  foreignKey: 'property_id',
  as: 'property'
});

User.hasMany(DailyActivityReport, {
  foreignKey: 'approved_by_id',
  as: 'approvedReports'
});
DailyActivityReport.belongsTo(User, {
  foreignKey: 'approved_by_id',
  as: 'approvedBy'
});

// Export models with their associations
const db = {
  sequelize,
  Sequelize: sequelize.Sequelize,
  User,
  Property,
  Guard,
  PropertyAssignment,
  Patrol,
  Incident,
  DailyActivityReport
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