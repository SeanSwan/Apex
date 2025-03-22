// backend/models/schedule.mjs
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.mjs';

class Schedule extends Model {
  // Check if shift is upcoming (within next 24 hours)
  isUpcoming() {
    if (!this.start_time) return false;
    
    const now = new Date();
    const start = new Date(this.start_time);
    const diffHours = (start - now) / (1000 * 60 * 60);
    
    return diffHours > 0 && diffHours <= 24;
  }
  
  // Check if shift is active/in-progress
  isActive() {
    if (!this.start_time || !this.end_time) return false;
    
    const now = new Date();
    const start = new Date(this.start_time);
    const end = new Date(this.end_time);
    
    return now >= start && now <= end;
  }
  
  // Check if shift is completed
  isCompleted() {
    if (!this.end_time) return false;
    
    return new Date() > new Date(this.end_time);
  }
  
  // Check if shift is confirmed by guard
  isConfirmed() {
    return this.confirmed;
  }
  
  // Calculate shift duration in hours
  getDurationHours() {
    if (!this.start_time || !this.end_time) return 0;
    
    const start = new Date(this.start_time);
    const end = new Date(this.end_time);
    return (end - start) / (1000 * 60 * 60);
  }
  
  // Check if shift has been swapped
  isSwapped() {
    return !!this.swapped_with;
  }
  
  // Get time until shift starts
  getTimeUntilStart() {
    if (!this.start_time || this.isActive() || this.isCompleted()) return null;
    
    const now = new Date();
    const start = new Date(this.start_time);
    const diffMs = start - now;
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHrs}h`;
    } else {
      return `${diffHrs}h ${diffMins}m`;
    }
  }
}

Schedule.init({
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
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Shift template this schedule is based on
  shift_template_id: {
    type: DataTypes.UUID,
    references: {
      model: 'shift_templates',
      key: 'id'
    }
  },
  // Basic schedule information
  title: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.TEXT
  },
  // Timing
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  duration_hours: {
    type: DataTypes.FLOAT
  },
  // Location
  location: {
    type: DataTypes.STRING
  },
  zone_id: {
    type: DataTypes.UUID,
    references: {
      model: 'security_zones',
      key: 'id'
    }
  },
  post_id: {
    type: DataTypes.UUID,
    references: {
      model: 'posts',
      key: 'id'
    }
  },
  // Shift details
  shift_type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'regular',
    validate: {
      isIn: [['regular', 'overtime', 'emergency', 'training', 'special_event', 'on_call', 'other']]
    }
  },
  shift_category: {
    type: DataTypes.STRING,
    defaultValue: 'day',
    validate: {
      isIn: [['day', 'night', 'evening', 'morning', 'afternoon', 'overnight', 'split', 'rotating', 'other']]
    }
  },
  recurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurrence_pattern: {
    type: DataTypes.JSONB,
    defaultValue: null
  },
  recurrence_end_date: {
    type: DataTypes.DATE
  },
  parent_recurring_id: {
    type: DataTypes.UUID,
    references: {
      model: 'schedules',
      key: 'id'
    }
  },
  // Requirements
  required_skills: {
    type: DataTypes.JSONB, // Array of required skills
    defaultValue: []
  },
  required_certifications: {
    type: DataTypes.JSONB, // Array of required certifications
    defaultValue: []
  },
  required_equipment: {
    type: DataTypes.JSONB, // Array of required equipment
    defaultValue: []
  },
  minimum_rank: {
    type: DataTypes.STRING
  },
  specific_guard_only: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Duties and responsibilities
  duties: {
    type: DataTypes.JSONB, // Array of duties
    defaultValue: []
  },
  patrol_route_id: {
    type: DataTypes.UUID,
    references: {
      model: 'patrol_routes',
      key: 'id'
    }
  },
  special_instructions: {
    type: DataTypes.TEXT
  },
  // Status tracking
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'scheduled',
    validate: {
      isIn: [['tentative', 'scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'missed', 'canceled']]
    }
  },
  published: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  confirmed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  confirmed_at: {
    type: DataTypes.DATE
  },
  check_in_time: {
    type: DataTypes.DATE
  },
  check_out_time: {
    type: DataTypes.DATE
  },
  check_in_latitude: {
    type: DataTypes.FLOAT
  },
  check_in_longitude: {
    type: DataTypes.FLOAT
  },
  check_out_latitude: {
    type: DataTypes.FLOAT
  },
  check_out_longitude: {
    type: DataTypes.FLOAT
  },
  check_in_photo: {
    type: DataTypes.STRING
  },
  check_out_photo: {
    type: DataTypes.STRING
  },
  on_time: {
    type: DataTypes.BOOLEAN
  },
  late_minutes: {
    type: DataTypes.INTEGER
  },
  // Swap and change tracking
  swapped: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  swapped_with: {
    type: DataTypes.UUID,
    references: {
      model: 'schedules',
      key: 'id'
    }
  },
  swap_requested_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  swap_approved_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  swap_reason: {
    type: DataTypes.TEXT
  },
  modified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  modified_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  modified_at: {
    type: DataTypes.DATE
  },
  modification_reason: {
    type: DataTypes.TEXT
  },
  // Cancellation tracking
  canceled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  canceled_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  canceled_at: {
    type: DataTypes.DATE
  },
  cancellation_reason: {
    type: DataTypes.TEXT
  },
  // Scheduling metadata
  scheduled_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  scheduled_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  // Notifications
  notification_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  last_notification_sent: {
    type: DataTypes.DATE
  },
  reminder_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reminder_sent_at: {
    type: DataTypes.DATE
  },
  // Payroll and billing
  is_billable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  billing_code: {
    type: DataTypes.STRING
  },
  billing_rate: {
    type: DataTypes.DECIMAL(10, 2)
  },
  billing_notes: {
    type: DataTypes.TEXT
  },
  is_overtime: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  overtime_rate: {
    type: DataTypes.DECIMAL(10, 2)
  },
  overtime_approved_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  overtime_notes: {
    type: DataTypes.TEXT
  },
  // Performance tracking
  performance_rating: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5
    }
  },
  performance_notes: {
    type: DataTypes.TEXT
  },
  rated_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Notes and documentation
  notes: {
    type: DataTypes.TEXT
  },
  guard_notes: {
    type: DataTypes.TEXT
  },
  supervisor_notes: {
    type: DataTypes.TEXT
  },
  attachments: {
    type: DataTypes.JSONB, // Array of attachment URLs
    defaultValue: []
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
  modelName: 'Schedule',
  tableName: 'schedules',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: (schedule) => {
      // Calculate duration in hours
      if (schedule.start_time && schedule.end_time) {
        const start = new Date(schedule.start_time);
        const end = new Date(schedule.end_time);
        schedule.duration_hours = (end - start) / (1000 * 60 * 60);
      }
    },
    beforeUpdate: (schedule) => {
      schedule.updated_at = new Date();
      
      // Calculate duration if times changed
      if ((schedule.changed('start_time') || schedule.changed('end_time')) && schedule.start_time && schedule.end_time) {
        const start = new Date(schedule.start_time);
        const end = new Date(schedule.end_time);
        schedule.duration_hours = (end - start) / (1000 * 60 * 60);
      }
      
      // Set timers if status changes
      if (schedule.changed('status')) {
        switch (schedule.status) {
          case 'confirmed':
            schedule.confirmed = true;
            schedule.confirmed_at = new Date();
            break;
          case 'canceled':
            schedule.canceled = true;
            schedule.canceled_at = new Date();
            break;
          case 'checked_in':
            if (!schedule.check_in_time) schedule.check_in_time = new Date();
            break;
          case 'completed':
            if (!schedule.check_out_time) schedule.check_out_time = new Date();
            break;
        }
      }
      
      // Set on_time and late_minutes if check-in time is set
      if (schedule.changed('check_in_time') && schedule.check_in_time && schedule.start_time) {
        const checkIn = new Date(schedule.check_in_time);
        const start = new Date(schedule.start_time);
        schedule.on_time = checkIn <= start;
        if (!schedule.on_time) {
          schedule.late_minutes = Math.floor((checkIn - start) / (1000 * 60));
        }
      }
    }
  },
  indexes: [
    { fields: ['property_id'] },
    { fields: ['user_id'] },
    { fields: ['shift_template_id'] },
    { fields: ['status'] },
    { fields: ['start_time'] },
    { fields: ['end_time'] },
    { fields: ['patrol_route_id'] }
  ]
});

// Define association methods that will be added after all models are defined
Schedule.associate = (models) => {
  // A schedule belongs to a property
  Schedule.belongsTo(models.Property, {
    foreignKey: 'property_id'
  });
  
  // A schedule is assigned to a user (guard)
  Schedule.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'Guard'
  });
  
  // A schedule may be based on a shift template
  Schedule.belongsTo(models.ShiftTemplate, {
    foreignKey: 'shift_template_id'
  });
  
  // A schedule may be assigned to a security zone
  Schedule.belongsTo(models.SecurityZone, {
    foreignKey: 'zone_id'
  });
  
  // A schedule may be assigned to a post
  Schedule.belongsTo(models.Post, {
    foreignKey: 'post_id'
  });
  
  // A schedule may include a patrol route
  Schedule.belongsTo(models.PatrolRoute, {
    foreignKey: 'patrol_route_id'
  });
  
  // A schedule may be part of a recurring series
  Schedule.belongsTo(models.Schedule, {
    foreignKey: 'parent_recurring_id',
    as: 'RecurringParent'
  });
  
  // A schedule may be swapped with another schedule
  Schedule.belongsTo(models.Schedule, {
    foreignKey: 'swapped_with',
    as: 'SwappedSchedule'
  });
  
  // A schedule may have had a swap requested by a user
  Schedule.belongsTo(models.User, {
    foreignKey: 'swap_requested_by',
    as: 'SwapRequester'
  });
  
  // A schedule swap may be approved by a user
  Schedule.belongsTo(models.User, {
    foreignKey: 'swap_approved_by',
    as: 'SwapApprover'
  });
  
  // A schedule may be modified by a user
  Schedule.belongsTo(models.User, {
    foreignKey: 'modified_by',
    as: 'Modifier'
  });
  
  // A schedule may be canceled by a user
  Schedule.belongsTo(models.User, {
    foreignKey: 'canceled_by',
    as: 'Canceler'
  });
  
  // A schedule may be created by a user
  Schedule.belongsTo(models.User, {
    foreignKey: 'scheduled_by',
    as: 'Scheduler'
  });
  
  // A schedule may have overtime approved by a user
  Schedule.belongsTo(models.User, {
    foreignKey: 'overtime_approved_by',
    as: 'OvertimeApprover'
  });
  
  // A schedule may be rated by a user
  Schedule.belongsTo(models.User, {
    foreignKey: 'rated_by',
    as: 'Rater'
  });
  
  // A schedule can have many time clock entries
  Schedule.hasMany(models.TimeClock, {
    foreignKey: 'schedule_id',
    as: 'TimeClockEntries'
  });
  
  // A schedule can have many breaks
  Schedule.hasMany(models.Break, {
    foreignKey: 'schedule_id',
    as: 'Breaks'
  });
  
  // A schedule can have many patrols assigned to it
  Schedule.hasMany(models.Patrol, {
    foreignKey: 'schedule_id',
    as: 'Patrols'
  });
  
  // A schedule can have many incidents reported during it
  Schedule.hasMany(models.Incident, {
    foreignKey: 'schedule_id',
    as: 'Incidents'
  });
  
  // A schedule can have many recurring instances if it's a recurring parent
  Schedule.hasMany(models.Schedule, {
    foreignKey: 'parent_recurring_id',
    as: 'RecurringInstances'
  });
  
  // A schedule can have many schedule notes
  Schedule.hasMany(models.ScheduleNote, {
    foreignKey: 'schedule_id',
    as: 'Notes'
  });
};

export default Schedule;