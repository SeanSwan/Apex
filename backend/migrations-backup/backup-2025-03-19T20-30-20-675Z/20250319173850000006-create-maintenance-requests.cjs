'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('maintenance_requests', {
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
      // Basic request information
      request_number: {
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
      // Request details
      request_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      priority: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'medium'
      },
      // Location details
      location: {
        type: Sequelize.STRING,
        allowNull: false
      },
      building: {
        type: Sequelize.STRING
      },
      floor: {
        type: Sequelize.STRING
      },
      room: {
        type: Sequelize.STRING
      },
      location_details: {
        type: Sequelize.TEXT
      },
      // Associated items
      zone_id: {
        type: Sequelize.UUID,
        references: {
          model: 'security_zones',
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
      camera_id: {
        type: Sequelize.UUID,
        references: {
          model: 'cameras',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      checkpoint_id: {
        type: Sequelize.UUID,
        references: {
          model: 'checkpoints',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      equipment_id: {
        type: Sequelize.UUID,
        references: {
          model: 'equipment',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      // Status tracking
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'open'
      },
      reported_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      assigned_at: {
        type: Sequelize.DATE
      },
      started_at: {
        type: Sequelize.DATE
      },
      completed_at: {
        type: Sequelize.DATE
      },
      closed_at: {
        type: Sequelize.DATE
      },
      due_date: {
        type: Sequelize.DATE
      },
      estimated_completion_date: {
        type: Sequelize.DATE
      },
      // Assignment
      assigned_to: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      assigned_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      assignment_notes: {
        type: Sequelize.TEXT
      },
      // External service provider
      requires_external_service: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      service_provider: {
        type: Sequelize.STRING
      },
      service_provider_contact: {
        type: Sequelize.STRING
      },
      service_provider_reference: {
        type: Sequelize.STRING
      },
      scheduled_service_date: {
        type: Sequelize.DATE
      },
      // Documentation
      photos: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      videos: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      documents: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      before_photos: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      after_photos: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      // Resolution
      resolution: {
        type: Sequelize.TEXT
      },
      resolution_code: {
        type: Sequelize.STRING
      },
      resolution_notes: {
        type: Sequelize.TEXT
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
      verification_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      verified_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      verified_at: {
        type: Sequelize.DATE
      },
      // Cost and billing
      estimated_cost: {
        type: Sequelize.DECIMAL(10, 2)
      },
      actual_cost: {
        type: Sequelize.DECIMAL(10, 2)
      },
      billable: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      invoice_number: {
        type: Sequelize.STRING
      },
      invoice_date: {
        type: Sequelize.DATE
      },
      // Parts and materials
      parts_required: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      parts_ordered: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      parts_received: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      // Client communication
      client_visible: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      client_notified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      client_notification_sent_at: {
        type: Sequelize.DATE
      },
      client_approval_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      client_approved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      client_approved_at: {
        type: Sequelize.DATE
      },
      client_notes: {
        type: Sequelize.TEXT
      },
      // Tracking
      related_incident_id: {
        type: Sequelize.UUID,
        references: {
          model: 'incidents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      follow_up_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      follow_up_date: {
        type: Sequelize.DATE
      },
      follow_up_notes: {
        type: Sequelize.TEXT
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
    await queryInterface.addIndex('maintenance_requests', ['request_number'], { unique: true });
    await queryInterface.addIndex('maintenance_requests', ['property_id']);
    await queryInterface.addIndex('maintenance_requests', ['reported_by']);
    await queryInterface.addIndex('maintenance_requests', ['assigned_to']);
    await queryInterface.addIndex('maintenance_requests', ['status']);
    await queryInterface.addIndex('maintenance_requests', ['priority']);
    await queryInterface.addIndex('maintenance_requests', ['due_date']);
    await queryInterface.addIndex('maintenance_requests', ['reported_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('maintenance_requests');
  }
};