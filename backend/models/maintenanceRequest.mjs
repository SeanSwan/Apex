// backend/models/maintenanceRequest.mjs
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.mjs';

class MaintenanceRequest extends Model {
  // Check if request is open/active
  isOpen() {
    return ['open', 'in_progress', 'on_hold'].includes(this.status);
  }
  
  // Check if request is high priority
  isHighPriority() {
    return ['high', 'emergency'].includes(this.priority);
  }
  
  // Check if request requires immediate attention
  requiresImmediateAttention() {
    return this.priority === 'emergency';
  }
  
  // Get time since request creation
  getTimeSinceCreation() {
    const now = new Date();
    const created = new Date(this.created_at);
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${diffDays}d ${diffHrs}h`;
  }
  
  // Check if request is overdue
  isOverdue() {
    if (!this.due_date) return false;
    
    const now = new Date();
    const due = new Date(this.due_date);
    return now > due && !['completed', 'closed', 'canceled'].includes(this.status);
  }
}

MaintenanceRequest.init({
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
  reported_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Basic request information
  request_number: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  // Request details
  request_type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [
        [
          'repair', 'replacement', 'inspection', 
          'installation', 'cleaning', 'preventative',
          'safety', 'security', 'electrical', 'plumbing', 
          'structural', 'hvac', 'landscaping', 'other'
        ]
      ]
    }
  },
  priority: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'medium',
    validate: {
      isIn: [['low', 'medium', 'high', 'emergency']]
    }
  },
  // Location details
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  building: {
    type: DataTypes.STRING
  },
  floor: {
    type: DataTypes.STRING
  },
  room: {
    type: DataTypes.STRING
  },
  location_details: {
    type: DataTypes.TEXT
  },
  // Associated items
  zone_id: {
    type: DataTypes.UUID,
    references: {
      model: 'security_zones',
      key: 'id'
    }
  },
  access_point_id: {
    type: DataTypes.UUID,
    references: {
      model: 'access_points',
      key: 'id'
    }
  },
  camera_id: {
    type: DataTypes.UUID,
    references: {
      model: 'cameras',
      key: 'id'
    }
  },
  checkpoint_id: {
    type: DataTypes.UUID,
    references: {
      model: 'checkpoints',
      key: 'id'
    }
  },
  equipment_id: {
    type: DataTypes.UUID,
    references: {
      model: 'equipment',
      key: 'id'
    }
  },
  // Status tracking
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'open',
    validate: {
      isIn: [['open', 'assigned', 'in_progress', 'on_hold', 'completed', 'closed', 'canceled']]
    }
  },
  reported_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  assigned_at: {
    type: DataTypes.DATE
  },
  started_at: {
    type: DataTypes.DATE
  },
  completed_at: {
    type: DataTypes.DATE
  },
  closed_at: {
    type: DataTypes.DATE
  },
  due_date: {
    type: DataTypes.DATE
  },
  estimated_completion_date: {
    type: DataTypes.DATE
  },
  // Assignment
  assigned_to: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assigned_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assignment_notes: {
    type: DataTypes.TEXT
  },
  // External service provider
  requires_external_service: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  service_provider: {
    type: DataTypes.STRING
  },
  service_provider_contact: {
    type: DataTypes.STRING
  },
  service_provider_reference: {
    type: DataTypes.STRING
  },
  scheduled_service_date: {
    type: DataTypes.DATE
  },
  // Documentation
  photos: {
    type: DataTypes.JSONB, // Array of photo URLs
    defaultValue: []
  },
  videos: {
    type: DataTypes.JSONB, // Array of video URLs
    defaultValue: []
  },
  documents: {
    type: DataTypes.JSONB, // Array of document URLs
    defaultValue: []
  },
  before_photos: {
    type: DataTypes.JSONB, // Array of before photos
    defaultValue: []
  },
  after_photos: {
    type: DataTypes.JSONB, // Array of after photos
    defaultValue: []
  },
  // Resolution
  resolution: {
    type: DataTypes.TEXT
  },
  resolution_code: {
    type: DataTypes.STRING
  },
  resolution_notes: {
    type: DataTypes.TEXT
  },
  resolved_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  verification_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verified_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  verified_at: {
    type: DataTypes.DATE
  },
  // Cost and billing
  estimated_cost: {
    type: DataTypes.DECIMAL(10, 2)
  },
  actual_cost: {
    type: DataTypes.DECIMAL(10, 2)
  },
  billable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  invoice_number: {
    type: DataTypes.STRING
  },
  invoice_date: {
    type: DataTypes.DATE
  },
  // Parts and materials
  parts_required: {
    type: DataTypes.JSONB, // Array of required parts
    defaultValue: []
  },
  parts_ordered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  parts_received: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Client communication
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
  client_approval_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  client_approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  client_approved_at: {
    type: DataTypes.DATE
  },
  client_notes: {
    type: DataTypes.TEXT
  },
  // Tracking
  related_incident_id: {
    type: DataTypes.UUID,
    references: {
      model: 'incidents',
      key: 'id'
    }
  },
  follow_up_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  follow_up_date: {
    type: DataTypes.DATE
  },
  follow_up_notes: {
    type: DataTypes.TEXT
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
  modelName: 'MaintenanceRequest',
  tableName: 'maintenance_requests',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: (request) => {
      // Generate request number if not provided
      if (!request.request_number) {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const typeCode = request.request_type.substring(0, 3).toUpperCase();
        const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        request.request_number = `MNT-${typeCode}-${dateStr}-${randomStr}`;
      }
    },
    beforeUpdate: (request) => {
      request.updated_at = new Date();
      
      // If status changed, update corresponding timestamp
      if (request.changed('status')) {
        switch (request.status) {
          case 'assigned':
            request.assigned_at = new Date();
            break;
          case 'in_progress':
            if (!request.started_at) request.started_at = new Date();
            break;
          case 'completed':
            request.completed_at = new Date();
            break;
          case 'closed':
            request.closed_at = new Date();
            break;
        }
      }
    }
  },
  indexes: [
    { unique: true, fields: ['request_number'] },
    { fields: ['property_id'] },
    { fields: ['reported_by'] },
    { fields: ['assigned_to'] },
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['due_date'] },
    { fields: ['reported_at'] }
  ]
});

// Define association methods that will be added after all models are defined
MaintenanceRequest.associate = (models) => {
  // A maintenance request belongs to a property
  MaintenanceRequest.belongsTo(models.Property, {
    foreignKey: 'property_id'
  });
  
  // A maintenance request is reported by a user
  MaintenanceRequest.belongsTo(models.User, {
    foreignKey: 'reported_by',
    as: 'Reporter'
  });
  
  // A maintenance request may be assigned to a user
  MaintenanceRequest.belongsTo(models.User, {
    foreignKey: 'assigned_to',
    as: 'Assignee'
  });
  
  // A maintenance request may be assigned by a user
  MaintenanceRequest.belongsTo(models.User, {
    foreignKey: 'assigned_by',
    as: 'Assigner'
  });
  
  // A maintenance request may be resolved by a user
  MaintenanceRequest.belongsTo(models.User, {
    foreignKey: 'resolved_by',
    as: 'Resolver'
  });
  
  // A maintenance request may be verified by a user
  MaintenanceRequest.belongsTo(models.User, {
    foreignKey: 'verified_by',
    as: 'Verifier'
  });
  
  // A maintenance request may be associated with a security zone
  MaintenanceRequest.belongsTo(models.SecurityZone, {
    foreignKey: 'zone_id'
  });
  
  // A maintenance request may be associated with an access point
  MaintenanceRequest.belongsTo(models.AccessPoint, {
    foreignKey: 'access_point_id'
  });
  
  // A maintenance request may be associated with a camera
  MaintenanceRequest.belongsTo(models.Camera, {
    foreignKey: 'camera_id'
  });
  
  // A maintenance request may be associated with a checkpoint
  MaintenanceRequest.belongsTo(models.Checkpoint, {
    foreignKey: 'checkpoint_id'
  });
  
  // A maintenance request may be associated with equipment
  MaintenanceRequest.belongsTo(models.Equipment, {
    foreignKey: 'equipment_id'
  });
  
  // A maintenance request may be related to an incident
  MaintenanceRequest.belongsTo(models.Incident, {
    foreignKey: 'related_incident_id',
    as: 'RelatedIncident'
  });
  
  // A maintenance request can have many comments
  MaintenanceRequest.hasMany(models.MaintenanceComment, {
    foreignKey: 'maintenance_id',
    as: 'Comments'
  });
  
  // A maintenance request can have many updates
  MaintenanceRequest.hasMany(models.MaintenanceUpdate, {
    foreignKey: 'maintenance_id',
    as: 'Updates'
  });
};

export default MaintenanceRequest;