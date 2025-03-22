// backend/models/checkpointScan.mjs
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.mjs';

class CheckpointScan extends Model {
  // Check if scan was successful
  isSuccessful() {
    return this.status === 'completed';
  }
  
  // Check if scan reported an issue
  hasIssue() {
    return this.issue_reported;
  }
  
  // Check if scan was verified by GPS
  isGpsVerified() {
    return this.gps_verified;
  }
  
  // Check if scan was on time based on route schedule
  wasOnTime() {
    return this.on_time;
  }
  
  // Check if scan has photo evidence
  hasPhoto() {
    return this.photos && this.photos.length > 0;
  }
}

CheckpointScan.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patrol_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'patrols',
      key: 'id'
    }
  },
  checkpoint_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'checkpoints',
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
  property_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'properties',
      key: 'id'
    }
  },
  // Scan details
  scan_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  sequence_number: {
    type: DataTypes.INTEGER // Order in patrol route
  },
  scheduled_time: {
    type: DataTypes.DATE // When the checkpoint was scheduled to be scanned
  },
  // Verification methods
  verification_method: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'qr_code',
    validate: {
      isIn: [['qr_code', 'nfc', 'rfid', 'barcode', 'manual', 'gps', 'other']]
    }
  },
  verification_data: {
    type: DataTypes.STRING // Scanned data (e.g., QR code content, NFC ID)
  },
  verification_successful: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Location tracking
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
  accuracy_meters: {
    type: DataTypes.FLOAT
  },
  gps_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  location_deviation_meters: {
    type: DataTypes.FLOAT // Distance from expected checkpoint location
  },
  // Compliance checks
  on_time: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  time_deviation_minutes: {
    type: DataTypes.INTEGER // Deviation from scheduled time in minutes
  },
  completed_actions: {
    type: DataTypes.JSON, // Array of completed required/optional actions
    defaultValue: []
  },
  skipped_actions: {
    type: DataTypes.JSON, // Array of skipped required actions
    defaultValue: []
  },
  action_compliance: {
    type: DataTypes.FLOAT, // Percentage of required actions completed
    defaultValue: 100
  },
  // Status and results
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'completed',
    validate: {
      isIn: [['completed', 'failed', 'skipped', 'attempted']]
    }
  },
  issue_reported: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  issue_type: {
    type: DataTypes.STRING,
    validate: {
      isIn: [['security', 'safety', 'maintenance', 'suspicious_activity', 'alarm', 'other']]
    }
  },
  issue_description: {
    type: DataTypes.TEXT
  },
  issue_severity: {
    type: DataTypes.STRING,
    validate: {
      isIn: [['low', 'medium', 'high', 'critical']]
    }
  },
  reported_incident_id: {
    type: DataTypes.UUID,
    references: {
      model: 'incidents',
      key: 'id'
    }
  },
  reported_maintenance_id: {
    type: DataTypes.UUID,
    references: {
      model: 'maintenance_requests',
      key: 'id'
    }
  },
  // Notes and documentation
  notes: {
    type: DataTypes.TEXT
  },
  photos: {
    type: DataTypes.JSON, // Array of photo URLs
    defaultValue: []
  },
  videos: {
    type: DataTypes.JSON, // Array of video URLs
    defaultValue: []
  },
  // Device information
  device_id: {
    type: DataTypes.STRING
  },
  device_type: {
    type: DataTypes.STRING
  },
  app_version: {
    type: DataTypes.STRING
  },
  battery_level: {
    type: DataTypes.FLOAT // Percentage
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
  modelName: 'CheckpointScan',
  tableName: 'checkpoint_scans',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeUpdate: (scan) => {
      scan.updated_at = new Date();
    },
    afterCreate: async (scan) => {
      try {
        // Update checkpoint's last scan information
        await sequelize.models.Checkpoint.update({
          last_scanned: scan.scan_time,
          last_scanned_by: scan.guard_id,
          last_scan_status: scan.issue_reported ? 'issue' : 'ok',
          last_scan_note: scan.notes,
          last_scan_photo: scan.photos && scan.photos.length > 0 ? scan.photos[0] : null
        }, {
          where: { id: scan.checkpoint_id }
        });
        
        // Update patrol's checkpoint scan count
        await sequelize.models.Patrol.update({
          checkpoints_scanned: sequelize.literal('checkpoints_scanned + 1')
        }, {
          where: { id: scan.patrol_id }
        });
        
        // If an issue was reported, ensure patrol has issues_found flag set
        if (scan.issue_reported) {
          await sequelize.models.Patrol.update({
            issues_found: true
          }, {
            where: { id: scan.patrol_id }
          });
        }
      } catch (error) {
        console.error('Error updating related records after checkpoint scan:', error);
      }
    }
  },
  indexes: [
    { fields: ['patrol_id'] },
    { fields: ['checkpoint_id'] },
    { fields: ['guard_id'] },
    { fields: ['property_id'] },
    { fields: ['scan_time'] },
    { fields: ['status'] },
    { fields: ['issue_reported'] }
  ]
});

// Define association methods that will be added after all models are defined
CheckpointScan.associate = (models) => {
  // A checkpoint scan belongs to a patrol
  CheckpointScan.belongsTo(models.Patrol, {
    foreignKey: 'patrol_id'
  });
  
  // A checkpoint scan belongs to a checkpoint
  CheckpointScan.belongsTo(models.Checkpoint, {
    foreignKey: 'checkpoint_id'
  });
  
  // A checkpoint scan is performed by a guard
  CheckpointScan.belongsTo(models.User, {
    foreignKey: 'guard_id',
    as: 'Guard'
  });
  
  // A checkpoint scan occurs at a property
  CheckpointScan.belongsTo(models.Property, {
    foreignKey: 'property_id'
  });
  
  // A checkpoint scan may be associated with a reported incident
  CheckpointScan.belongsTo(models.Incident, {
    foreignKey: 'reported_incident_id',
    as: 'ReportedIncident'
  });
  
  // A checkpoint scan may be associated with a maintenance request
  CheckpointScan.belongsTo(models.MaintenanceRequest, {
    foreignKey: 'reported_maintenance_id',
    as: 'MaintenanceRequest'
  });
};

export default CheckpointScan;