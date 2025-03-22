// backend/models/property.mjs
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.mjs';

class Property extends Model {
  // Method to check if property has active security coverage
  hasActiveGuards() {
    return this.active_guards > 0;
  }
  
  // Method to get the time since last patrol
  getTimeSinceLastPatrol() {
    if (!this.last_patrol_timestamp) return 'No patrols recorded';
    const now = new Date();
    const lastPatrol = new Date(this.last_patrol_timestamp);
    const diffMs = now - lastPatrol;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m`;
  }
}

Property.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  // Basic property information
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['residential', 'commercial', 'industrial', 'retail', 'mixed_use', 'other']]
    }
  },
  // Location information
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  zip_code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  country: {
    type: DataTypes.STRING,
    defaultValue: 'USA'
  },
  // Geo coordinates for mapping
  latitude: {
    type: DataTypes.FLOAT,
    validate: {
      min: -90,
      max: 90
    }
  },
  longitude: {
    type: DataTypes.FLOAT,
    validate: {
      min: -180,
      max: 180
    }
  },
  // Client information
  client_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Property details
  size_sq_ft: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0
    }
  },
  num_buildings: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  num_floors: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  num_units: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  year_built: {
    type: DataTypes.INTEGER
  },
  // Security related information
  security_level: {
    type: DataTypes.STRING,
    defaultValue: 'standard',
    validate: {
      isIn: [['low', 'standard', 'high', 'critical']]
    }
  },
  has_gate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  has_reception: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  has_security_office: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  num_cameras: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  num_entry_points: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  requires_patrol: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  patrol_frequency_hours: {
    type: DataTypes.FLOAT,
    defaultValue: 1.0
  },
  // Contact information
  emergency_contact_name: {
    type: DataTypes.STRING
  },
  emergency_contact_phone: {
    type: DataTypes.STRING
  },
  property_manager_name: {
    type: DataTypes.STRING
  },
  property_manager_phone: {
    type: DataTypes.STRING
  },
  property_manager_email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  // Security coverage and status tracking
  last_patrol_timestamp: {
    type: DataTypes.DATE
  },
  next_patrol_due: {
    type: DataTypes.DATE
  },
  active_guards: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  guard_hours_per_week: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  patrol_route: {
    type: DataTypes.TEXT
  },
  patrol_instructions: {
    type: DataTypes.TEXT
  },
  // Business information
  contract_start_date: {
    type: DataTypes.DATEONLY
  },
  contract_end_date: {
    type: DataTypes.DATEONLY
  },
  billing_rate: {
    type: DataTypes.DECIMAL(10, 2)
  },
  billing_frequency: {
    type: DataTypes.STRING,
    defaultValue: 'monthly',
    validate: {
      isIn: [['weekly', 'bi-weekly', 'monthly', 'quarterly', 'annually']]
    }
  },
  contract_status: {
    type: DataTypes.STRING,
    defaultValue: 'active',
    validate: {
      isIn: [['pending', 'active', 'on_hold', 'terminated']]
    }
  },
  // Customization options
  theme_primary_color: {
    type: DataTypes.STRING,
    defaultValue: '#3366FF' // Default blue
  },
  theme_secondary_color: {
    type: DataTypes.STRING,
    defaultValue: '#FF6633' // Default orange
  },
  logo_url: {
    type: DataTypes.STRING
  },
  // System fields
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active',
    validate: {
      isIn: [['pending', 'active', 'inactive']]
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
  modelName: 'Property',
  tableName: 'properties',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeUpdate: (property) => {
      property.updated_at = new Date();
      
      // Calculate next patrol due time if patrol frequency is set
      if (property.changed('last_patrol_timestamp') && property.patrol_frequency_hours > 0) {
        const lastPatrol = new Date(property.last_patrol_timestamp);
        property.next_patrol_due = new Date(
          lastPatrol.getTime() + (property.patrol_frequency_hours * 60 * 60 * 1000)
        );
      }
    }
  }
});

export default Property;