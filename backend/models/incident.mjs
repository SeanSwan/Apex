// backend/models/incident.mjs
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.mjs';

class Incident extends Model {
  // Check if incident is active/open
  isActive() {
    return !['resolved', 'closed', 'false_alarm'].includes(this.status);
  }
  
  // Check if incident is escalated
  isEscalated() {
    return this.escalation_level > 0;
  }
  
  // Check if incident is high priority
  isHighPriority() {
    return ['high', 'critical'].includes(this.priority);
  }
  
  // Check if incident requires immediate response
  requiresImmediateResponse() {
    return this.priority === 'critical' || this.requires_emergency_services;
  }
  
  // Get incident duration
  getDuration() {
    const start = new Date(this.reported_at);
    const end = this.resolved_at ? new Date(this.resolved_at) : new Date();
    const diffMs = end - start;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m`;
  }
  
  // Check if incident involves an alarm
  involvesAlarm() {
    return this.incident_type === 'alarm' || this.alarm_triggered;
  }
  
  // Check if incident was created via voice call
  isVoiceGenerated() {
    return this.voice_generated === true;
  }
  
  // Get voice call information
  getVoiceCallInfo() {
    if (!this.voice_generated) return null;
    
    return {
      call_id: this.voice_call_id,
      caller_phone: this.caller_phone,
      call_duration: this.call_duration_seconds,
      recording_url: this.call_recording_url,
      transcript: this.call_transcript,
      ai_confidence: this.ai_confidence_score
    };
  }
  
  // Check if call recording is available
  hasCallRecording() {
    return this.call_recording_url && this.call_recording_url.length > 0;
  }
}

Incident.init({
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
  // Incident details
  incident_number: {
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
  incident_type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [
        [
          'trespassing', 'theft', 'vandalism', 'suspicious_activity', 
          'alarm', 'fire', 'medical', 'hazard', 'property_damage',
          'assault', 'disturbance', 'weapon', 'unauthorized_access',
          'environmental', 'policy_violation', 'other'
        ]
      ]
    }
  },
  incident_subtype: {
    type: DataTypes.STRING
  },
  // Severity and priority
  severity: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'medium',
    validate: {
      isIn: [['low', 'medium', 'high', 'critical']]
    }
  },
  priority: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'medium',
    validate: {
      isIn: [['low', 'medium', 'high', 'critical']]
    }
  },
  // Timing
  reported_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  occurred_at: {
    type: DataTypes.DATE
  },
  estimated_duration: {
    type: DataTypes.INTEGER // Minutes
  },
  // Location details
  location: {
    type: DataTypes.STRING
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
  // People involved
  reported_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assigned_to: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  handled_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  witnesses: {
    type: DataTypes.JSON, // Array of witness IDs or names
    defaultValue: []
  },
  involved_persons: {
    type: DataTypes.JSON, // Array of involved person details
    defaultValue: []
  },
  // Response details
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'open',
    validate: {
      isIn: [['open', 'in_progress', 'under_investigation', 'escalated', 'pending', 'resolved', 'closed', 'false_alarm']]
    }
  },
  response_status: {
    type: DataTypes.STRING,
    defaultValue: 'waiting',
    validate: {
      isIn: [['waiting', 'en_route', 'on_scene', 'handling', 'complete']]
    }
  },
  response_time_minutes: {
    type: DataTypes.INTEGER
  },
  escalation_level: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  escalated_at: {
    type: DataTypes.DATE
  },
  escalated_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  escalation_reason: {
    type: DataTypes.TEXT
  },
  requires_emergency_services: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emergency_services_called: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emergency_services_called_at: {
    type: DataTypes.DATE
  },
  emergency_services_called_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  emergency_services_types: {
    type: DataTypes.JSON, // Array of service types (police, fire, ambulance)
    defaultValue: []
  },
  emergency_services_reference: {
    type: DataTypes.STRING
  },
  // Actions and handling
  actions_taken: {
    type: DataTypes.TEXT
  },
  immediate_actions: {
    type: DataTypes.TEXT
  },
  follow_up_actions: {
    type: DataTypes.TEXT
  },
  resolution_details: {
    type: DataTypes.TEXT
  },
  resolution_code: {
    type: DataTypes.STRING
  },
  resolved_at: {
    type: DataTypes.DATE
  },
  resolved_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  closed_at: {
    type: DataTypes.DATE
  },
  closed_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
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
  audio: {
    type: DataTypes.JSON, // Array of audio URLs
    defaultValue: []
  },
  documents: {
    type: DataTypes.JSON, // Array of document URLs
    defaultValue: []
  },
  associated_camera_ids: {
    type: DataTypes.JSON, // Array of camera IDs that captured the incident
    defaultValue: []
  },
  evidence_details: {
    type: DataTypes.TEXT
  },
  // Related items
  related_incident_ids: {
    type: DataTypes.JSON, // Array of related incident IDs
    defaultValue: []
  },
  alarm_triggered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  alarm_id: {
    type: DataTypes.UUID,
    references: {
      model: 'alarms',
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
  // Cost and impact
  estimated_cost: {
    type: DataTypes.DECIMAL(10, 2)
  },
  impact_level: {
    type: DataTypes.STRING,
    validate: {
      isIn: [['none', 'low', 'medium', 'high', 'critical']]
    }
  },
  business_impact: {
    type: DataTypes.TEXT
  },
  // Reporting and notifications
  reported_to_authorities: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  police_report_number: {
    type: DataTypes.STRING
  },
  insurance_claim_number: {
    type: DataTypes.STRING
  },
  notifications_sent: {
    type: DataTypes.JSON, // Array of notification details
    defaultValue: []
  },
  client_notified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  client_notified_at: {
    type: DataTypes.DATE
  },
  // Analysis and prevention
  root_cause: {
    type: DataTypes.TEXT
  },
  contributing_factors: {
    type: DataTypes.JSON, // Array of contributing factors
    defaultValue: []
  },
  preventative_measures: {
    type: DataTypes.TEXT
  },
  lessons_learned: {
    type: DataTypes.TEXT
  },
  // Tags and categorization
  tags: {
    type: DataTypes.JSON, // Array of tags
    defaultValue: []
  },
  custom_fields: {
    type: DataTypes.JSON, // Object of custom fields
    defaultValue: {}
  },
  // VOICE AI DISPATCHER FIELDS - MASTER PROMPT v49.0
  // ================================================
  // Revolutionary Voice AI Dispatcher integration
  voice_generated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'True if incident was created via Voice AI Dispatcher'
  },
  voice_call_id: {
    type: DataTypes.STRING,
    comment: 'Unique identifier for the voice call'
  },
  caller_phone: {
    type: DataTypes.STRING,
    comment: 'Phone number of the caller'
  },
  caller_name: {
    type: DataTypes.STRING,
    comment: 'Name of the caller if provided during call'
  },
  call_duration_seconds: {
    type: DataTypes.INTEGER,
    comment: 'Total duration of the voice call in seconds'
  },
  call_recording_url: {
    type: DataTypes.STRING,
    comment: 'URL to the call recording (Twilio recording)'
  },
  call_transcript: {
    type: DataTypes.JSON, // Array of transcript entries
    defaultValue: [],
    comment: 'Full conversation transcript with timestamps'
  },
  ai_responses: {
    type: DataTypes.JSON, // Array of AI responses
    defaultValue: [],
    comment: 'All AI-generated responses during the call'
  },
  ai_confidence_score: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.0,
    validate: {
      min: 0.0,
      max: 1.0
    },
    comment: 'AI confidence score for incident classification (0.0-1.0)'
  },
  human_takeover: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'True if human dispatcher took over the call'
  },
  takeover_time: {
    type: DataTypes.DATE,
    comment: 'Timestamp when human took over the call'
  },
  sop_executed: {
    type: DataTypes.STRING,
    comment: 'Standard Operating Procedure ID that was executed'
  },
  autonomous_actions: {
    type: DataTypes.JSON, // Array of actions taken automatically
    defaultValue: [],
    comment: 'List of autonomous actions taken by Voice AI (guard dispatch, police call, etc.)'
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
  modelName: 'Incident',
  tableName: 'incidents',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: (incident) => {
      // Generate incident number if not provided
      if (!incident.incident_number) {
        const dateStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 8);
        const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        incident.incident_number = `INC-${dateStr}-${randomStr}`;
      }
    },
    beforeUpdate: (incident) => {
      incident.updated_at = new Date();
      
      // Set resolution time if status changed to resolved
      if (incident.changed('status') && incident.status === 'resolved' && !incident.resolved_at) {
        incident.resolved_at = new Date();
      }
      
      // Set closed time if status changed to closed
      if (incident.changed('status') && incident.status === 'closed' && !incident.closed_at) {
        incident.closed_at = new Date();
      }
      
      // Set escalation time if escalation level increased
      if (incident.changed('escalation_level') && incident.escalation_level > 0 && !incident.escalated_at) {
        incident.escalated_at = new Date();
      }
    },
    afterCreate: async (incident) => {
      try {
        // Update property's incident count and last incident date
        await sequelize.models.Property.update({
          incident_count_ytd: sequelize.literal('incident_count_ytd + 1'),
          last_incident_date: incident.reported_at
        }, {
          where: { id: incident.property_id }
        });
        
        // If incident is in a zone, update zone's incident count
        if (incident.zone_id) {
          await sequelize.models.SecurityZone.update({
            incident_count: sequelize.literal('incident_count + 1'),
            last_incident_timestamp: incident.reported_at
          }, {
            where: { id: incident.zone_id }
          });
        }
      } catch (error) {
        console.error('Error updating related records after incident creation:', error);
      }
    }
  },
  indexes: [
    { unique: true, fields: ['incident_number'] },
    { fields: ['property_id'] },
    { fields: ['zone_id'] },
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['reported_at'] },
    { fields: ['reported_by'] },
    { fields: ['assigned_to'] },
    // Voice AI Dispatcher indexes
    { fields: ['voice_generated'] },
    { fields: ['voice_call_id'] },
    { fields: ['caller_phone'] },
    { fields: ['human_takeover'] },
    { fields: ['ai_confidence_score'] }
  ]
});

// Define association methods that will be added after all models are defined
Incident.associate = (models) => {
  // An incident belongs to a property
  Incident.belongsTo(models.Property, {
    foreignKey: 'property_id'
  });
  
  // An incident may belong to a security zone
  Incident.belongsTo(models.SecurityZone, {
    foreignKey: 'zone_id'
  });
  
  // An incident was reported by a user
  Incident.belongsTo(models.User, {
    foreignKey: 'reported_by',
    as: 'Reporter'
  });
  
  // An incident may be assigned to a user
  Incident.belongsTo(models.User, {
    foreignKey: 'assigned_to',
    as: 'Assignee'
  });
  
  // An incident may be handled by a user
  Incident.belongsTo(models.User, {
    foreignKey: 'handled_by',
    as: 'Handler'
  });
  
  // An incident may be escalated by a user
  Incident.belongsTo(models.User, {
    foreignKey: 'escalated_by',
    as: 'Escalator'
  });
  
  // An incident may be resolved by a user
  Incident.belongsTo(models.User, {
    foreignKey: 'resolved_by',
    as: 'Resolver'
  });
  
  // An incident may be closed by a user
  Incident.belongsTo(models.User, {
    foreignKey: 'closed_by',
    as: 'Closer'
  });
  
  // An incident may be associated with an alarm
  Incident.belongsTo(models.Alarm, {
    foreignKey: 'alarm_id'
  });
  
  // An incident may be associated with an access point
  Incident.belongsTo(models.AccessPoint, {
    foreignKey: 'access_point_id'
  });
  
  // An incident can have many follow-up actions
  Incident.hasMany(models.IncidentFollowUp, {
    foreignKey: 'incident_id',
    as: 'FollowUps'
  });
  
  // An incident can have many notes
  Incident.hasMany(models.IncidentNote, {
    foreignKey: 'incident_id',
    as: 'Notes'
  });
  
  // An incident can have many notifications
  Incident.hasMany(models.Notification, {
    foreignKey: 'incident_id',
    as: 'Notifications'
  });
  
  // An incident can have many reports
  Incident.hasMany(models.Report, {
    foreignKey: 'incident_id',
    as: 'Reports'
  });
};

export default Incident;