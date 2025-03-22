// backend/models/patrolRoute.mjs
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.mjs';

class PatrolRoute extends Model {
  // Check if route is active
  isActive() {
    return this.status === 'active';
  }
  
  // Get estimated duration in minutes
  getEstimatedDuration() {
    return this.estimated_duration_minutes;
  }
  
  // Get total distance in meters
  getTotalDistance() {
    return this.total_distance_meters;
  }
  
  // Check if route has checkpoints
  hasCheckpoints() {
    return this.checkpoint_count > 0;
  }
  
  // Check if route requires vehicle
  requiresVehicle() {
    return this.requires_vehicle;
  }
}

PatrolRoute.init({
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
  // Route details
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  route_code: {
    type: DataTypes.STRING,
    unique: true
  },
  route_type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'standard',
    validate: {
      isIn: [['standard', 'emergency', 'perimeter', 'interior', 'custom']]
    }
  },
  // Route metrics
  estimated_duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
    validate: {
      min: 1
    }
  },
  total_distance_meters: {
    type: DataTypes.FLOAT
  },
  difficulty_level: {
    type: DataTypes.STRING,
    defaultValue: 'medium',
    validate: {
      isIn: [['easy', 'medium', 'hard', 'very_hard']]
    }
  },
  // Checkpoint information
  checkpoint_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  checkpoints: {
    type: DataTypes.JSON, // Array of ordered checkpoint objects with sequence numbers
    defaultValue: []
  },
  // Route path
  route_path: {
    type: DataTypes.JSON, // Array of lat/long coordinates defining the path
    defaultValue: []
  },
  route_map_image: {
    type: DataTypes.STRING // URL to route map image
  },
  // Requirements
  required_skills: {
    type: DataTypes.JSON, // Array of required skills
    defaultValue: []
  },
  required_certifications: {
    type: DataTypes.JSON, // Array of required certifications
    defaultValue: []
  },
  requires_vehicle: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  vehicle_type: {
    type: DataTypes.STRING
  },
  requires_equipment: {
    type: DataTypes.JSON, // Array of required equipment
    defaultValue: []
  },
  // Special instructions
  special_instructions: {
    type: DataTypes.TEXT
  },
  hazard_warnings: {
    type: DataTypes.TEXT
  },
  key_focus_areas: {
    type: DataTypes.JSON, // Array of areas requiring special attention
    defaultValue: []
  },
  // Schedule information
  default_frequency: {
    type: DataTypes.STRING,
    defaultValue: 'daily',
    validate: {
      isIn: [['hourly', 'daily', 'weekly', 'monthly', 'custom']]
    }
  },
  default_days: {
    type: DataTypes.JSON, // Array of days (0-6, Sunday-Saturday)
    defaultValue: [0, 1, 2, 3, 4, 5, 6]
  },
  default_times: {
    type: DataTypes.JSON, // Array of times for scheduled patrols (24h format)
    defaultValue: []
  },
  recurring_schedule: {
    type: DataTypes.JSON, // Complex schedule object
    defaultValue: null
  },
  // Status
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive', 'draft', 'archived']]
    }
  },
  // Metrics
  average_completion_time: {
    type: DataTypes.INTEGER // Minutes
  },
  compliance_rate: {
    type: DataTypes.FLOAT // Percentage
  },
  issue_discovery_rate: {
    type: DataTypes.FLOAT // Issues per patrol
  },
  // System fields
  created_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  last_updated_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
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
  modelName: 'PatrolRoute',
  tableName: 'patrol_routes',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: (route) => {
      // Generate route code if not provided
      if (!route.route_code) {
        const prefix = route.name.substring(0, 2).toUpperCase();
        const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        route.route_code = `RT-${prefix}${randomStr}`;
      }
    },
    beforeUpdate: (route) => {
      route.updated_at = new Date();
    }
  },
  indexes: [
    { unique: true, fields: ['route_code'] },
    { fields: ['property_id'] },
    { fields: ['status'] },
    { fields: ['route_type'] }
  ]
});

// Define association methods that will be added after all models are defined
PatrolRoute.associate = (models) => {
  // A patrol route belongs to a property
  PatrolRoute.belongsTo(models.Property, {
    foreignKey: 'property_id'
  });
  
  // A patrol route was created by a user
  PatrolRoute.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'Creator'
  });
  
  // A patrol route was last updated by a user
  PatrolRoute.belongsTo(models.User, {
    foreignKey: 'last_updated_by',
    as: 'Updater'
  });
  
  // A patrol route can have many checkpoints
  PatrolRoute.belongsToMany(models.Checkpoint, {
    through: 'patrol_route_checkpoints',
    foreignKey: 'patrol_route_id',
    otherKey: 'checkpoint_id'
  });
  
  // A patrol route can have many scheduled patrols
  PatrolRoute.hasMany(models.Patrol, {
    foreignKey: 'patrol_route_id',
    as: 'Patrols'
  });
  
  // A patrol route can be assigned to guards for recurring patrols
  PatrolRoute.belongsToMany(models.User, {
    through: 'patrol_route_assignments',
    foreignKey: 'patrol_route_id',
    otherKey: 'guard_id',
    as: 'AssignedGuards'
  });
};

export default PatrolRoute;