// backend/models/patrol.mjs
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.mjs';

class Patrol extends Model {
  // Check if patrol is completed
  isCompleted() {
    return this.status === 'completed';
  }
  
  // Check if patrol is in progress
  isInProgress() {
    return this.status === 'in_progress';
  }
  
  // Check if patrol is missed/overdue
  isMissed() {
    return this.status === 'missed';
  }
  
  // Calculate patrol duration in minutes
  getDuration() {
    if (!this.start_time || !this.end_time) return null;
    
    const start = new Date(this.start_time);
    const end = new Date(this.end_time);
    return Math.round((end - start) / (60 * 1000));
  }
  
  // Check if patrol was on time (started within 15 minutes of scheduled time)
  wasOnTime() {
    if (!this.scheduled_at || !this.start_time) return false;
    
    const scheduled = new Date(this.scheduled_at);
    const started = new Date(this.start_time);
    const diffMinutes = Math.abs((started - scheduled) / (60 * 1000));
    
    return diffMinutes <= 15;
  }
  
  // Check if all checkpoints were scanned
  allCheckpointsScanned() {
    if (!this.checkpoints_total || !this.checkpoints_scanned) return false;
    return this.checkpoints_scanned >= this.checkpoints_total;
  }
  
  // Calculate checkpoint compliance percentage
  getCheckpointCompliance() {
    if (!this.checkpoints_total || this.checkpoints_total === 0) return 100;
    return Math.round((this.checkpoints_scanned / this.checkpoints_total) * 100);
  }
  
  // Check if any incidents were reported during patrol
  hasIncidentsReported() {
    return this.incidents_reported > 0;
  }
}

Patrol.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  property_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'properties',
      key: 'id'
    }
  },
  patrol_route_id: {
    type: DataTypes.UUID,
    references: {
      model: 'patrol_routes',
      key: 'id'
    }
  },
  guard_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Basic patrol information
  patrol_number: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  patrol_type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'regular',
    validate: {
      isIn: [['regular', 'drive-by', 'foot', 'bicycle', 'scheduled', 'emergency', 'special', 'custom']]
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  // Timing information
  scheduled_at: {
    type: DataTypes.DATE
  },
  start_time: {
    type: DataTypes.DATE
  },
  end_time: {
    type: DataTypes.DATE
  },
  estimated_duration_minutes: {
    type: DataTypes.INTEGER
  },
  actual_duration_minutes: {
    type: DataTypes.INTEGER
  },
  // Status and tracking
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'scheduled',
    validate: {
      isIn: [['scheduled', 'in_progress', 'completed', 'missed', 'canceled', 'incomplete']]
    }
  },
  started_on_time: {
    type: DataTypes.BOOLEAN
  },
  completed_on_time: {
    type: DataTypes.BOOLEAN
  },
  // Checkpoint tracking
  checkpoints_total: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  checkpoints_scanned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  checkpoint_compliance: {
    type: DataTypes.FLOAT, // Percentage
    defaultValue: 0
  },
  // Location tracking
  start_location: {
    type: DataTypes.JSON // Lat/Long coordinates
  },
  end_location: {
    type: DataTypes.JSON // Lat/Long coordinates
  },
  path_taken: {
    type: DataTypes.JSON // Array of lat/long coordinates showing patrol path
  },
  distance_traveled: {
    type: DataTypes.FLOAT // Distance in meters
  },
  // Findings and incidents
  findings: {
    type: DataTypes.TEXT
  },
  notes: {
    type: DataTypes.TEXT
  },
  issues_found: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  incidents_reported: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  incident_ids: {
    type: DataTypes.JSON, // Array of incident IDs reported during patrol
    defaultValue: []
  },
  maintenance_issues: {
    type: DataTypes.JSON, // Array of maintenance issues found
    defaultValue: []
  },
  // Evidence and documentation
  photos: {
    type: DataTypes.JSON, // Array of photo URLs
    defaultValue: []
  },
  videos: {
    type: DataTypes.JSON, // Array of video URLs
    defaultValue: []
  },
  // Weather conditions during patrol
  weather_conditions: {
    type: DataTypes.STRING
  },
  temperature: {
    type: DataTypes.FLOAT // Temperature in Celsius
  },
  weather_details: {
    type: DataTypes.JSON
  },
  // Supervisor and review information
  supervisor_id: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  reviewed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reviewed_at: {
    type: DataTypes.DATE
  },
  reviewed_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  review_notes: {
    type: DataTypes.TEXT
  },
  review_rating: {
    type: DataTypes.INTEGER, // 1-5 rating
    validate: {
      min: 1,
      max: 5
    }
  },
  // Billing and client information
  billable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  billing_code: {
    type: DataTypes.STRING
  },
  client_visible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  client_notified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  client_notification_sent_at: {
    type: DataTypes.DATE
  },
  // Equipment used
  equipment_used: {
    type: DataTypes.JSON, // Array of equipment IDs used during patrol
    defaultValue: []
  },
  vehicle_id: {
    type: DataTypes.UUID,
    references: {
      model: 'vehicles',
      key: 'id'
    }
  },
  vehicle_start_mileage: {
    type: DataTypes.FLOAT
  },
  vehicle_end_mileage: {
    type: DataTypes.FLOAT
  },
  // System fields
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Patrol',
  tableName: 'patrols',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: (patrol) => {
      // Generate patrol number if not provided
      if (!patrol.patrol_number) {
        const dateStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 8);
        const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        patrol.patrol_number = `PTL-${dateStr}-${randomStr}`;
      }
    },
    beforeUpdate: (patrol) => {
      patrol.updated_at = new Date();
      
      // Calculate duration if start and end times are set
      if (patrol.start_time && patrol.end_time) {
        const start = new Date(patrol.start_time);
        const end = new Date(patrol.end_time);
        patrol.actual_duration_minutes = Math.round((end - start) / (60 * 1000));
      }
      
      // Calculate checkpoint compliance
      if (patrol.checkpoints_total > 0) {
        patrol.checkpoint_compliance = Math.round((patrol.checkpoints_scanned / patrol.checkpoints_total) * 100);
      }
      
      // Set started_on_time flag
      if (patrol.scheduled_at && patrol.start_time && patrol.started_on_time === null) {
        const scheduled = new Date(patrol.scheduled_at);
        const started = new Date(patrol.start_time);
        const diffMinutes = (started - scheduled) / (60 * 1000);
        patrol.started_on_time = diffMinutes <= 15;
      }
    },
    afterUpdate: async (patrol) => {
      // If patrol status changed to completed, update property's last patrol timestamp
      if (patrol.changed('status') && patrol.status === 'completed') {
        try {
          await sequelize.models.Property.update({
            last_patrol_timestamp: patrol.end_time || new Date(),
            last_patrol_id: patrol.id
          }, {
            where: { id: patrol.property_id }
          });
        } catch (error) {
          console.error('Error updating property after patrol completion:', error);
        }
      }
    }
  },
  indexes: [
    { unique: true, fields: ['patrol_number'] },
    { fields: ['property_id'] },
    { fields: ['guard_id'] },
    { fields: ['patrol_route_id'] },
    { fields: ['status'] },
    { fields: ['scheduled_at'] },
    { fields: ['start_time'] }
  ]
});

// Define association methods that will be added after all models are defined
Patrol.associate = (models) => {
  // A patrol belongs to a property
  Patrol.belongsTo(models.Property, {
    foreignKey: 'property_id'
  });
  
  // A patrol may follow a patrol route
  Patrol.belongsTo(models.PatrolRoute, {
    foreignKey: 'patrol_route_id'
  });
  
  // A patrol is conducted by a guard
  Patrol.belongsTo(models.User, {
    foreignKey: 'guard_id',
    as: 'Guard'
  });
  
  // A patrol may be supervised by a supervisor
  Patrol.belongsTo(models.User, {
    foreignKey: 'supervisor_id',
    as: 'Supervisor'
  });
  
  // A patrol may be reviewed by a user
  Patrol.belongsTo(models.User, {
    foreignKey: 'reviewed_by',
    as: 'Reviewer'
  });
  
  // A patrol may use a vehicle
  Patrol.belongsTo(models.Vehicle, {
    foreignKey: 'vehicle_id'
  });
  
  // A patrol can have many checkpoint scans
  Patrol.hasMany(models.CheckpointScan, {
    foreignKey: 'patrol_id',
    as: 'CheckpointScans'
  });
  
  // A patrol can have many incident reports
  Patrol.hasMany(models.Incident, {
    foreignKey: 'patrol_id',
    as: 'Incidents'
  });
  
  // A patrol can have many patrol notes
  Patrol.hasMany(models.PatrolNote, {
    foreignKey: 'patrol_id',
    as: 'Notes'
  });
  
  // A patrol can have many patrol activities
  Patrol.hasMany(models.PatrolActivity, {
    foreignKey: 'patrol_id',
    as: 'Activities'
  });
};

export default Patrol;