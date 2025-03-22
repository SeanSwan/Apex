// backend/models/key.mjs
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.mjs';

class Key extends Model {
  // Check if key is available
  isAvailable() {
    return this.status === 'available';
  }
  
  // Check if key is currently issued
  isIssued() {
    return this.status === 'issued';
  }
  
  // Check if key is master key
  isMasterKey() {
    return this.key_type === 'master';
  }
  
  // Check if key is expired
  isExpired() {
    if (!this.expiry_date) return false;
    return new Date() > new Date(this.expiry_date);
  }
  
  // Get time since issue if issued
  getTimeSinceIssue() {
    if (!this.issued_date) return null;
    
    const now = new Date();
    const issued = new Date(this.issued_date);
    const diffMs = now - issued;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${diffDays}d ${diffHrs}h`;
  }
}

Key.init({
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
  // Key details
  key_code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  key_type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'standard',
    validate: {
      isIn: [['standard', 'master', 'grand_master', 'sub_master', 'emergency', 'temporary', 'electronic', 'card', 'fob', 'biometric', 'other']]
    }
  },
  // Physical characteristics
  physical_key: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  color: {
    type: DataTypes.STRING
  },
  markings: {
    type: DataTypes.STRING
  },
  key_number: {
    type: DataTypes.STRING
  },
  manufacturer: {
    type: DataTypes.STRING
  },
  model: {
    type: DataTypes.STRING
  },
  // Electronic credentials
  is_electronic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  credential_id: {
    type: DataTypes.STRING
  },
  card_number: {
    type: DataTypes.STRING
  },
  access_level: {
    type: DataTypes.STRING,
    defaultValue: 'standard',
    validate: {
      isIn: [['standard', 'restricted', 'limited', 'full', 'temporary', 'emergency']]
    }
  },
  // Access details
  access_zones: {
    type: DataTypes.JSONB, // Array of zone IDs this key can access
    defaultValue: []
  },
  access_points: {
    type: DataTypes.JSONB, // Array of access point IDs this key can open
    defaultValue: []
  },
  access_schedule: {
    type: DataTypes.JSONB, // Time periods when access is allowed
    defaultValue: null
  },
  restricted_areas: {
    type: DataTypes.JSONB, // Areas explicitly restricted for this key
    defaultValue: []
  },
  // Status
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'available',
    validate: {
      isIn: [['available', 'issued', 'lost', 'damaged', 'retired', 'pending']]
    }
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Issuance tracking
  issued_to: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  issued_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  issued_date: {
    type: DataTypes.DATE
  },
  expected_return_date: {
    type: DataTypes.DATE
  },
  return_date: {
    type: DataTypes.DATE
  },
  returned_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  received_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  return_condition: {
    type: DataTypes.STRING,
    validate: {
      isIn: [['excellent', 'good', 'fair', 'poor', 'damaged', 'unusable']]
    }
  },
  // Temporary keys and expiration
  temporary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  creation_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  expiry_date: {
    type: DataTypes.DATE
  },
  deactivated_date: {
    type: DataTypes.DATE
  },
  deactivated_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  deactivation_reason: {
    type: DataTypes.TEXT
  },
  // Security measures
  requires_signature: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  signature_image: {
    type: DataTypes.STRING // URL to signature image
  },
  requires_deposit: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deposit_amount: {
    type: DataTypes.DECIMAL(10, 2)
  },
  deposit_paid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deposit_returned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Lost/stolen tracking
  reported_lost: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reported_lost_date: {
    type: DataTypes.DATE
  },
  reported_lost_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  lost_report_details: {
    type: DataTypes.TEXT
  },
  // Key replacement
  replacement_for: {
    type: DataTypes.UUID,
    references: {
      model: 'keys',
      key: 'id'
    }
  },
  replaced_by: {
    type: DataTypes.UUID,
    references: {
      model: 'keys',
      key: 'id'
    }
  },
  replacement_reason: {
    type: DataTypes.TEXT
  },
  // Duplication tracking
  do_not_duplicate: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  copies_made: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Audit and tracking
  last_audit_date: {
    type: DataTypes.DATE
  },
  last_audit_status: {
    type: DataTypes.STRING,
    validate: {
      isIn: [['verified', 'missing', 'incorrect_location', 'incorrect_status']]
    }
  },
  last_audit_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Usage tracking
  last_used: {
    type: DataTypes.DATE
  },
  usage_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Notes and documentation
  notes: {
    type: DataTypes.TEXT
  },
  photos: {
    type: DataTypes.JSONB, // Array of photo URLs
    defaultValue: []
  },
  documents: {
    type: DataTypes.JSONB, // Array of document URLs
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
  modelName: 'Key',
  tableName: 'keys',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: (key) => {
      // Generate key code if not provided
      if (!key.key_code) {
        const prefix = key.key_type.substring(0, 2).toUpperCase();
        const propertyCode = key.property_id.substring(0, 4);
        const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        key.key_code = `${prefix}-${propertyCode}-${randomStr}`;
      }
    },
    beforeUpdate: (key) => {
      key.updated_at = new Date();
      
      // If status changed to 'issued', update issued_date
      if (key.changed('status') && key.status === 'issued' && !key.issued_date) {
        key.issued_date = new Date();
      }
      
      // If status changed from 'issued' to 'available', update return_date
      if (key.changed('status') && key.previous('status') === 'issued' && key.status === 'available' && !key.return_date) {
        key.return_date = new Date();
      }
      
      // If status changed to 'lost', update reported_lost and date
      if (key.changed('status') && key.status === 'lost' && !key.reported_lost) {
        key.reported_lost = true;
        key.reported_lost_date = new Date();
      }
    }
  },
  indexes: [
    { unique: true, fields: ['key_code'] },
    { fields: ['property_id'] },
    { fields: ['status'] },
    { fields: ['key_type'] },
    { fields: ['issued_to'] },
    { fields: ['issued_date'] },
    { fields: ['expiry_date'] }
  ]
});

// Define association methods that will be added after all models are defined
Key.associate = (models) => {
  // A key belongs to a property
  Key.belongsTo(models.Property, {
    foreignKey: 'property_id'
  });
  
  // A key may be issued to a user
  Key.belongsTo(models.User, {
    foreignKey: 'issued_to',
    as: 'KeyHolder'
  });
  
  // A key may be issued by a user
  Key.belongsTo(models.User, {
    foreignKey: 'issued_by',
    as: 'Issuer'
  });
  
  // A key may be returned by a user
  Key.belongsTo(models.User, {
    foreignKey: 'returned_by',
    as: 'Returner'
  });
  
  // A key may be received on return by a user
  Key.belongsTo(models.User, {
    foreignKey: 'received_by',
    as: 'Receiver'
  });
  
  // A key may be deactivated by a user
  Key.belongsTo(models.User, {
    foreignKey: 'deactivated_by',
    as: 'Deactivator'
  });
  
  // A key may be reported lost by a user
  Key.belongsTo(models.User, {
    foreignKey: 'reported_lost_by',
    as: 'LostReporter'
  });
  
  // A key may be audited by a user
  Key.belongsTo(models.User, {
    foreignKey: 'last_audit_by',
    as: 'Auditor'
  });
  
  // A key may be a replacement for another key
  Key.belongsTo(models.Key, {
    foreignKey: 'replacement_for',
    as: 'ReplacedKey'
  });
  
  // A key may be replaced by another key
  Key.belongsTo(models.Key, {
    foreignKey: 'replaced_by',
    as: 'ReplacementKey'
  });
  
  // A key can access many access points
  Key.belongsToMany(models.AccessPoint, {
    through: 'access_point_keys',
    foreignKey: 'key_id',
    otherKey: 'access_point_id'
  });
  
  // A key can access many security zones
  Key.belongsToMany(models.SecurityZone, {
    through: 'key_zone_access',
    foreignKey: 'key_id',
    otherKey: 'zone_id'
  });
  
  // A key can have many access events
  Key.hasMany(models.AccessEvent, {
    foreignKey: 'key_id',
    as: 'AccessEvents'
  });
  
  // A key can have many key audits
  Key.hasMany(models.KeyAudit, {
    foreignKey: 'key_id',
    as: 'Audits'
  });
};

export default Key;