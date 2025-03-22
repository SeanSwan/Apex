// backend/models/checkpoint.mjs
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.mjs';

class Checkpoint extends Model {
  // Check if checkpoint needs verification
  needsVerification() {
    if (!this.last_scanned) return true;
    
    const now = new Date();
    const lastScanned = new Date(this.last_scanned);
    const diffHours = (now - lastScanned) / (1000 * 60 * 60);
    
    return diffHours > this.scan_frequency_hours;
  }
  
  // Get time since last scan
  getTimeSinceLastScan() {
    if (!this.last_scanned) return 'Never scanned';
    
    const now = new Date();
    const lastScanned = new Date(this.last_scanned);
    const diffMs = now - lastScanned;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m`;
  }
  
  // Check if checkpoint is in compliance
  isInCompliance() {
    return !this.needsVerification();
  }
  
  // Check if checkpoint has special instructions
  hasSpecialInstructions() {
    return !!this.special_instructions && this.special_instructions.trim().length > 0;
  }
  
  // Generate QR code data
  getQrCodeData() {
    return JSON.stringify({
      id: this.id,
      property_id: this.property_id,
      code: this.checkpoint_code,
      name: this.name,
      type: 'checkpoint'
    });
  }
}

Checkpoint.init({
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
  zone_id: {
    type: DataTypes.UUID,
    references: {
      model: 'security_zones',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  checkpoint_code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT
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
  location_details: {
    type: DataTypes.TEXT
  },
  // Geographic coordinates
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
  // Indoor coordinates (on floor plan)
  indoor_x: {
    type: DataTypes.FLOAT
  },
  indoor_y: {
    type: DataTypes.FLOAT
  },
  // Type and verification details
  checkpoint_type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'standard',
    validate: {
      isIn: [['standard', 'emergency', 'access_point', 'hazard', 'critical', 'maintenance', 'custom']]
    }
  },
  verification_method: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'qr_code',
    validate: {
      isIn: [['qr_code', 'nfc', 'rfid', 'barcode', 'manual', 'gps', 'other']]
    }
  },
  verification_data: {
    type: DataTypes.STRING // QR code data, NFC ID, RFID tag number, etc.
  },
  // Patrol and verification requirements
  scan_frequency_hours: {
    type: DataTypes.FLOAT,
    defaultValue: 24.0,
    validate: {
      min: 0
    }
  },
  required_actions: {
    type: DataTypes.JSON, // Array of required actions at this checkpoint
    defaultValue: []
  },
  optional_actions: {
    type: DataTypes.JSON, // Array of optional actions at this checkpoint
    defaultValue: []
  },
  requires_photo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  requires_note: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  special_instructions: {
    type: DataTypes.TEXT
  },
  // Verification status
  last_scanned: {
    type: DataTypes.DATE
  },
  last_scanned_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  last_scan_status: {
    type: DataTypes.STRING,
    validate: {
      isIn: [['ok', 'issue', 'maintenance_needed', 'emergency', 'other']]
    }
  },
  last_scan_note: {
    type: DataTypes.TEXT
  },
  last_scan_photo: {
    type: DataTypes.STRING
  },
  next_scan_due: {
    type: DataTypes.DATE
  },
  // Status and compliance
  compliance_status: {
    type: DataTypes.STRING,
    defaultValue: 'compliant',
    validate: {
      isIn: [['compliant', 'overdue', 'pending', 'issue_reported']]
    }
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive', 'maintenance', 'removed']]
    }
  },
  // Routes and tasks
  patrol_routes: {
    type: DataTypes.JSON, // Array of patrol route IDs that include this checkpoint
    defaultValue: []
  },
  order_in_routes: {
    type: DataTypes.JSON, // Object mapping route IDs to checkpoint order numbers
    defaultValue: {}
  },
  assigned_tasks: {
    type: DataTypes.JSON, // Array of task IDs assigned to this checkpoint
    defaultValue: []
  },
  // Hazard and safety
  potential_hazards: {
    type: DataTypes.JSON, // Array of potential hazards at this checkpoint
    defaultValue: []
  },
  safety_instructions: {
    type: DataTypes.TEXT
  },
  // Associated items
  associated_equipment: {
    type: DataTypes.JSON, // Array of equipment IDs associated with this checkpoint
    defaultValue: []
  },
  associated_access_points: {
    type: DataTypes.JSON, // Array of access point IDs associated with this checkpoint
    defaultValue: []
  },
  associated_cameras: {
    type: DataTypes.JSON, // Array of camera IDs that can view this checkpoint
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
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'Checkpoint',
  tableName: 'checkpoints',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeUpdate: (checkpoint) => {
      checkpoint.updated_at = new Date();
    },
    afterUpdate: (checkpoint) => {
      // Calculate next scan due time if last_scanned changed
      if (checkpoint.changed('last_scanned') && checkpoint.scan_frequency_hours > 0) {
        const lastScanned = new Date(checkpoint.last_scanned);
        checkpoint.next_scan_due = new Date(
          lastScanned.getTime() + (checkpoint.scan_frequency_hours * 60 * 60 * 1000)
        );
        
        // Update compliance status
        checkpoint.compliance_status = checkpoint.needsVerification() ? 'overdue' : 'compliant';
        
        // Save changes
        checkpoint.save({ fields: ['next_scan_due', 'compliance_status'] });
      }
    }
  },
  indexes: [
    { unique: true, fields: ['checkpoint_code'] },
    { fields: ['property_id'] },
    { fields: ['zone_id'] },
    { fields: ['status'] },
    { fields: ['compliance_status'] },
    { fields: ['next_scan_due'] }
  ]
});

// Define association methods that will be added after all models are defined
Checkpoint.associate = (models) => {
  // A checkpoint belongs to a property
  Checkpoint.belongsTo(models.Property, {
    foreignKey: 'property_id'
  });
  
  // A checkpoint may belong to a security zone
  Checkpoint.belongsTo(models.SecurityZone, {
    foreignKey: 'zone_id'
  });
  
  // A checkpoint was last scanned by a guard
  Checkpoint.belongsTo(models.User, {
    foreignKey: 'last_scanned_by',
    as: 'LastScannedBy'
  });
  
  // A checkpoint can belong to many patrol routes
  Checkpoint.belongsToMany(models.PatrolRoute, {
    through: 'patrol_route_checkpoints',
    foreignKey: 'checkpoint_id',
    otherKey: 'patrol_route_id'
  });
  
  // A checkpoint can have many checkpoint scans
  Checkpoint.hasMany(models.CheckpointScan, {
    foreignKey: 'checkpoint_id',
    as: 'Scans'
  });
  
  // A checkpoint can have many issues reported
  Checkpoint.hasMany(models.Issue, {
    foreignKey: 'checkpoint_id',
    as: 'Issues'
  });
  
  // A checkpoint can have many maintenance requests
  Checkpoint.hasMany(models.MaintenanceRequest, {
    foreignKey: 'checkpoint_id',
    as: 'MaintenanceRequests'
  });
};

export default Checkpoint;