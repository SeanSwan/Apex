// backend/models/guard.mjs
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.mjs';

class Guard extends Model {
  // Check if guard is currently on duty
  isOnDuty() {
    return this.duty_status === 'on_duty';
  }
  
  // Check if guard has active license
  hasValidLicense() {
    if (!this.license_expiry) return false;
    return new Date(this.license_expiry) > new Date();
  }
  
  // Calculate years of experience
  getExperienceYears() {
    if (!this.start_date) return 0;
    const start = new Date(this.start_date);
    const now = new Date();
    return Math.floor((now - start) / (365.25 * 24 * 60 * 60 * 1000));
  }
  
  // Get all certifications as array
  getCertifications() {
    return this.certifications ? this.certifications.split(',').map(cert => cert.trim()) : [];
  }
}

Guard.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  // Link to user account
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Personal information
  badge_number: {
    type: DataTypes.STRING,
    unique: true
  },
  employee_id: {
    type: DataTypes.STRING,
    unique: true
  },
  // Employment information
  employment_status: {
    type: DataTypes.STRING,
    defaultValue: 'full_time',
    validate: {
      isIn: [['full_time', 'part_time', 'contractor', 'temporary', 'on_leave', 'terminated']]
    }
  },
  position: {
    type: DataTypes.STRING,
    defaultValue: 'security_guard',
    validate: {
      isIn: [['security_guard', 'supervisor', 'patrol_officer', 'console_operator', 'dispatcher']]
    }
  },
  rank: {
    type: DataTypes.STRING,
    defaultValue: 'guard',
    validate: {
      isIn: [['trainee', 'guard', 'senior_guard', 'supervisor', 'manager', 'director']]
    }
  },
  start_date: {
    type: DataTypes.DATEONLY
  },
  end_date: {
    type: DataTypes.DATEONLY
  },
  // Duty status tracking
  duty_status: {
    type: DataTypes.STRING,
    defaultValue: 'off_duty',
    validate: {
      isIn: [['on_duty', 'off_duty', 'on_break', 'on_leave', 'unavailable']]
    }
  },
  last_clock_in: {
    type: DataTypes.DATE
  },
  last_clock_out: {
    type: DataTypes.DATE
  },
  current_property_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'properties',
      key: 'id'
    }
  },
  current_location_lat: {
    type: DataTypes.FLOAT,
    validate: {
      min: -90,
      max: 90
    }
  },
  current_location_lng: {
    type: DataTypes.FLOAT,
    validate: {
      min: -180,
      max: 180
    }
  },
  last_location_update: {
    type: DataTypes.DATE
  },
  // Skills and qualifications
  armed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  license_number: {
    type: DataTypes.STRING
  },
  license_state: {
    type: DataTypes.STRING
  },
  license_expiry: {
    type: DataTypes.DATEONLY
  },
  license_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  firearm_license: {
    type: DataTypes.STRING
  },
  firearm_license_expiry: {
    type: DataTypes.DATEONLY
  },
  certifications: {
    type: DataTypes.TEXT // Comma-separated list of certifications
  },
  languages: {
    type: DataTypes.TEXT // Comma-separated list of languages
  },
  special_skills: {
    type: DataTypes.TEXT
  },
  // Equipment tracking
  assigned_equipment: {
    type: DataTypes.TEXT // JSON string with equipment details
  },
  has_body_camera: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  has_radio: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  vehicle_id: {
    type: DataTypes.STRING
  },
  // Performance metrics
  reliability_score: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 10
    }
  },
  performance_score: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 10
    }
  },
  response_time_avg: {
    type: DataTypes.INTEGER, // Average response time in seconds
    defaultValue: 0
  },
  num_incidents_reported: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  num_patrols_completed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  hours_worked_current_week: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  hours_worked_current_month: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  // Schedule related fields
  availability: {
    type: DataTypes.TEXT // JSON string with availability data
  },
  preferred_shift: {
    type: DataTypes.STRING,
    validate: {
      isIn: [['day', 'night', 'morning', 'evening', 'any']]
    }
  },
  max_hours_per_week: {
    type: DataTypes.INTEGER,
    defaultValue: 40
  },
  // Training information
  training_level: {
    type: DataTypes.STRING,
    defaultValue: 'basic',
    validate: {
      isIn: [['basic', 'intermediate', 'advanced', 'specialized']]
    }
  },
  training_hours_completed: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  last_training_date: {
    type: DataTypes.DATEONLY
  },
  next_training_due: {
    type: DataTypes.DATEONLY
  },
  // System fields
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active',
    validate: {
      isIn: [['pending', 'active', 'suspended', 'terminated']]
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
  modelName: 'Guard',
  tableName: 'guards',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeUpdate: (guard) => {
      guard.updated_at = new Date();
    }
  }
});

export default Guard;