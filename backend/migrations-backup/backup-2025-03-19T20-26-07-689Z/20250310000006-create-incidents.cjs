'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('incidents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      property_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'properties',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      zone_id: {
        type: Sequelize.UUID,
        references: {
          model: 'security_zones',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      // Incident details
      incident_number: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      incident_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      incident_subtype: {
        type: Sequelize.STRING
      },
      // Severity and priority
      severity: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'medium'
      },
      priority: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'medium'
      },
      // Timing
      reported_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      occurred_at: {
        type: Sequelize.DATE
      },
      estimated_duration: {
        type: Sequelize.INTEGER // Minutes
      },
      // Location details
      location: {
        type: Sequelize.STRING
      },
      building: {
        type: Sequelize.STRING
      },
      floor: {
        type: Sequelize.STRING
      },
      location_details: {
        type: Sequelize.TEXT
      },
      // Geographic coordinates
      latitude: {
        type: Sequelize.FLOAT
      },
      longitude: {
        type: Sequelize.FLOAT
      },
      // Indoor coordinates (on floor plan)
      indoor_x: {
        type: Sequelize.FLOAT
      },
      indoor_y: {
        type: Sequelize.FLOAT
      },
      // People involved
      reported_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      assigned_to: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      handled_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      witnesses: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      involved_persons: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      // Response details
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'open'
      },
      response_status: {
        type: Sequelize.STRING,
        defaultValue: 'waiting'
      },
      response_time_minutes: {
        type: Sequelize.INTEGER
      },
      escalation_level: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      escalated_at: {
        type: Sequelize.DATE
      },
      escalated_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      escalation_reason: {
        type: Sequelize.TEXT
      },
      requires_emergency_services: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      emergency_services_called: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      emergency_services_called_at: {
        type: Sequelize.DATE
      },
      emergency_services_called_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      emergency_services_types: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      emergency_services_reference: {
        type: Sequelize.STRING
      },
      // Actions and handling
      actions_taken: {
        type: Sequelize.TEXT
      },
      immediate_actions: {
        type: Sequelize.TEXT
      },
      follow_up_actions: {
        type: Sequelize.TEXT
      },
      resolution_details: {
        type: Sequelize.TEXT
      },
      resolution_code: {
        type: Sequelize.STRING
      },
      resolved_at: {
        type: Sequelize.DATE
      },
      resolved_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      closed_at: {
        type: Sequelize.DATE
      },
      closed_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      // Evidence and documentation
      photos: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      videos: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      audio: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      documents: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      associated_camera_ids: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      evidence_details: {
        type: Sequelize.TEXT
      },
      // Related items
      related_incident_ids: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      alarm_triggered: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      alarm_id: {
        type: Sequelize.UUID,
        references: {
          model: 'alarms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      access_point_id: {
        type: Sequelize.UUID,
        references: {
          model: 'access_points',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      // Cost and impact
      estimated_cost: {
        type: Sequelize.DECIMAL(10, 2)
      },
      impact_level: {
        type: Sequelize.STRING
      },
      business_impact: {
        type: Sequelize.TEXT
      },
      // Reporting and notifications
      reported_to_authorities: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      police_report_number: {
        type: Sequelize.STRING
      },
      insurance_claim_number: {
        type: Sequelize.STRING
      },
      notifications_sent: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      client_notified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      client_notified_at: {
        type: Sequelize.DATE
      },
      // Analysis and prevention
      root_cause: {
        type: Sequelize.TEXT
      },
      contributing_factors: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      preventative_measures: {
        type: Sequelize.TEXT
      },
      lessons_learned: {
        type: Sequelize.TEXT
      },
      // Tags and categorization
      tags: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      custom_fields: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      // System fields
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('incidents', ['incident_number'], { unique: true });
    await queryInterface.addIndex('incidents', ['property_id']);
    await queryInterface.addIndex('incidents', ['zone_id']);
    await queryInterface.addIndex('incidents', ['status']);
    await queryInterface.addIndex('incidents', ['priority']);
    await queryInterface.addIndex('incidents', ['reported_at']);
    await queryInterface.addIndex('incidents', ['reported_by']);
    await queryInterface.addIndex('incidents', ['assigned_to']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('incidents');
  }
};