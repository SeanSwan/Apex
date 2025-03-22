// backend/models/propertyAssignment.mjs
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.mjs';

class PropertyAssignment extends Model {
  // Check if assignment is active
  isActive() {
    return this.status === 'active';
  }
  
  // Check if assignment is temporary
  isTemporary() {
    return !!this.end_date && this.status === 'active';
  }
  
  // Check if assignment is permanent (no end date)
  isPermanent() {
    return !this.end_date && this.status === 'active';
  }
  
  // Check if assignment has expired
  isExpired() {
    if (!this.end_date) return false;
    return new Date() > new Date(this.end_date);
  }
  
  // Get time remaining on temporary assignment
  getTimeRemaining() {
    if (!this.end_date || this.status !== 'active') return null;
    
    const now = new Date();
    const end = new Date(this.end_date);
    
    if (now > end) return 'Expired';
    
    const diffMs = end - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    return `${diffDays} days`;
  }
  
  // Check if guard is primary for this property
  isPrimary() {
    return this.is_primary;
  }
}

PropertyAssignment.init({
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
  // Assignment details
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  end_date: {
    type: DataTypes.DATEONLY
  },
  assignment_type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'regular',
    validate: {
      isIn: [['regular', 'temporary', 'special', 'emergency', 'training', 'rotation']]
    }
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'guard',
    validate: {
      isIn: [['guard', 'supervisor', 'lead_guard', 'coordinator', 'manager', 'other']]
    }
  },
  // Assignment status
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive', 'pending', 'terminated', 'completed']]
    }
  },
  // Guard relationship to property
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_backup: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_special_assignment: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Schedule details
  shift_type: {
    type: DataTypes.STRING,
    validate: {
      isIn: [['day', 'night', 'evening', 'morning', 'afternoon', 'overnight', 'rotating', 'flexible', 'other']]
    }
  },
  schedule_details: {
    type: DataTypes.JSONB, // Structured schedule information
    defaultValue: {}
  },
  hours_per_week: {
    type: DataTypes.FLOAT
  },
  // Assignment details
  assigned_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assigned_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  notes: {
    type: DataTypes.TEXT
  },
  // Post or zone assignments
  assigned_zones: {
    type: DataTypes.JSONB, // Array of zone IDs
    defaultValue: []
  },
  assigned_posts: {
    type: DataTypes.JSONB, // Array of post IDs
    defaultValue: []
  },
  // Responsibilities
  duties: {
    type: DataTypes.JSONB, // Array of duty descriptions
    defaultValue: []
  },
  special_instructions: {
    type: DataTypes.TEXT
  },
  // Required skills and certifications
  required_skills: {
    type: DataTypes.JSONB, // Array of required skills
    defaultValue: []
  },
  required_certifications: {
    type: DataTypes.JSONB, // Array of required certifications
    defaultValue: []
  },
  // Billing and payroll
  billing_code: {
    type: DataTypes.STRING
  },
  billing_rate: {
    type: DataTypes.DECIMAL(10, 2)
  },
  pay_rate: {
    type: DataTypes.DECIMAL(10, 2)
  },
  is_billable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Access control
  access_level: {
    type: DataTypes.STRING,
    defaultValue: 'standard',
    validate: {
      isIn: [['standard', 'restricted', 'limited', 'full', 'emergency']]
    }
  },
  access_credentials_issued: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  access_card_number: {
    type: DataTypes.STRING
  },
  // Termination information
  termination_date: {
    type: DataTypes.DATEONLY
  },
  termination_reason: {
    type: DataTypes.TEXT
  },
  terminated_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
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
  // Training and orientation
  orientation_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  orientation_date: {
    type: DataTypes.DATEONLY
  },
  training_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  training_date: {
    type: DataTypes.DATEONLY
  },
  // Client approval
  client_approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  client_approved_by: {
    type: DataTypes.STRING
  },
  client_approved_date: {
    type: DataTypes.DATEONLY
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
  modelName: 'PropertyAssignment',
  tableName: 'property_assignments',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeUpdate: (assignment) => {
      assignment.updated_at = new Date();
      
      // If status changed to 'terminated', set termination date
      if (assignment.changed('status') && assignment.status === 'terminated' && !assignment.termination_date) {
        assignment.termination_date = new Date();
      }
      
      // Check if assignment should be auto-expired
      if (assignment.end_date && assignment.status === 'active') {
        const today = new Date();
        const endDate = new Date(assignment.end_date);
        
        if (today > endDate) {
          assignment.status = 'completed';
        }
      }
    },
    afterCreate: async (assignment) => {
      // If this is a primary assignment, update any other primary assignments for this property to non-primary
      if (assignment.is_primary) {
        try {
          await PropertyAssignment.update({
            is_primary: false
          }, {
            where: {
              property_id: assignment.property_id,
              user_id: { [sequelize.Op.ne]: assignment.user_id },
              is_primary: true
            }
          });
        } catch (error) {
          console.error('Error updating other property assignments:', error);
        }
      }
      
      // If this is a new active assignment, update property's active_guards count
      if (assignment.status === 'active') {
        try {
          await sequelize.models.Property.increment('active_guards', {
            by: 1,
            where: { id: assignment.property_id }
          });
        } catch (error) {
          console.error('Error updating property active_guards count:', error);
        }
      }
    },
    afterUpdate: async (assignment) => {
      // If status changed from 'active' to non-active, decrement property's active_guards count
      if (assignment.changed('status') && assignment.previous('status') === 'active' && assignment.status !== 'active') {
        try {
          await sequelize.models.Property.decrement('active_guards', {
            by: 1,
            where: { id: assignment.property_id }
          });
        } catch (error) {
          console.error('Error updating property active_guards count:', error);
        }
      }
      
      // If status changed to 'active' from non-active, increment property's active_guards count
      if (assignment.changed('status') && assignment.previous('status') !== 'active' && assignment.status === 'active') {
        try {
          await sequelize.models.Property.increment('active_guards', {
            by: 1,
            where: { id: assignment.property_id }
          });
        } catch (error) {
          console.error('Error updating property active_guards count:', error);
        }
      }
    }
  },
  indexes: [
    { fields: ['property_id'] },
    { fields: ['user_id'] },
    { fields: ['status'] },
    { fields: ['is_primary'] },
    { fields: ['start_date'] },
    { fields: ['end_date'] }
  ]
});

// Define association methods that will be added after all models are defined
PropertyAssignment.associate = (models) => {
  // A property assignment belongs to a property
  PropertyAssignment.belongsTo(models.Property, {
    foreignKey: 'property_id'
  });
  
  // A property assignment belongs to a user (guard)
  PropertyAssignment.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'Guard'
  });
  
  // A property assignment may be created by a user
  PropertyAssignment.belongsTo(models.User, {
    foreignKey: 'assigned_by',
    as: 'Assigner'
  });
  
  // A property assignment may be terminated by a user
  PropertyAssignment.belongsTo(models.User, {
    foreignKey: 'terminated_by',
    as: 'Terminator'
  });
  
  // A property assignment can be associated with many zones
  PropertyAssignment.belongsToMany(models.SecurityZone, {
    through: 'assignment_zones',
    foreignKey: 'assignment_id',
    otherKey: 'zone_id'
  });
  
  // A property assignment can be associated with many posts
  PropertyAssignment.belongsToMany(models.Post, {
    through: 'assignment_posts',
    foreignKey: 'assignment_id',
    otherKey: 'post_id'
  });
  
  // A property assignment can have many assignment notes
  PropertyAssignment.hasMany(models.AssignmentNote, {
    foreignKey: 'assignment_id',
    as: 'Notes'
  });
  
  // A property assignment can have many performance reviews
  PropertyAssignment.hasMany(models.PerformanceReview, {
    foreignKey: 'assignment_id',
    as: 'PerformanceReviews'
  });
  
  // A property assignment can have many schedules
  PropertyAssignment.hasMany(models.Schedule, {
    foreignKey: 'assignment_id',
    as: 'Schedules'
  });
  
  // A property assignment can have many training records
  PropertyAssignment.hasMany(models.AssignmentTraining, {
    foreignKey: 'assignment_id',
    as: 'TrainingRecords'
  });
};

export default PropertyAssignment;