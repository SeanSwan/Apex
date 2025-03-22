'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('patrols', {
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
      patrol_route_id: {
        type: Sequelize.UUID,
        references: {
          model: 'patrol_routes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      guard_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      // Basic patrol information
      patrol_number: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      patrol_type: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'regular'
      },
      description: {
        type: Sequelize.TEXT
      },
      // Timing information
      scheduled_at: {
        type: Sequelize.DATE
      },
      start_time: {
        type: Sequelize.DATE
      },
      end_time: {
        type: Sequelize.DATE
      },
      estimated_duration_minutes: {
        type: Sequelize.INTEGER
      },
      actual_duration_minutes: {
        type: Sequelize.INTEGER
      },
      // Status and tracking
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'scheduled'
      },
      started_on_time: {
        type: Sequelize.BOOLEAN
      },
      completed_on_time: {
        type: Sequelize.BOOLEAN
      },
      // Checkpoint tracking
      checkpoints_total: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      checkpoints_scanned: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      checkpoint_compliance: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      // Location tracking
      start_location: {
        type: Sequelize.JSONB
      },
      end_location: {
        type: Sequelize.JSONB
      },
      path_taken: {
        type: Sequelize.JSONB
      },
      distance_traveled: {
        type: Sequelize.FLOAT
      },
      // Findings and incidents
      findings: {
        type: Sequelize.TEXT
      },
      notes: {
        type: Sequelize.TEXT
      },
      issues_found: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      incidents_reported: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      incident_ids: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      maintenance_issues: {
        type: Sequelize.JSONB,
        defaultValue: []
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
      // Weather conditions during patrol
      weather_conditions: {
        type: Sequelize.STRING
      },
      temperature: {
        type: Sequelize.FLOAT
      },
      weather_details: {
        type: Sequelize.JSONB
      },
      // Supervisor and review information
      supervisor_id: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      reviewed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      reviewed_at: {
        type: Sequelize.DATE
      },
      reviewed_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      review_notes: {
        type: Sequelize.TEXT
      },
      review_rating: {
        type: Sequelize.INTEGER
      },
      // Billing and client information
      billable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      billing_code: {
        type: Sequelize.STRING
      },
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
      // Equipment used
      equipment_used: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      vehicle_id: {
        type: Sequelize.UUID,
        references: {
          model: 'vehicles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      vehicle_start_mileage: {
        type: Sequelize.FLOAT
      },
      vehicle_end_mileage: {
        type: Sequelize.FLOAT
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
    await queryInterface.addIndex('patrols', ['patrol_number'], { unique: true });
    await queryInterface.addIndex('patrols', ['property_id']);
    await queryInterface.addIndex('patrols', ['guard_id']);
    await queryInterface.addIndex('patrols', ['patrol_route_id']);
    await queryInterface.addIndex('patrols', ['status']);
    await queryInterface.addIndex('patrols', ['scheduled_at']);
    await queryInterface.addIndex('patrols', ['start_time']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('patrols');
  }
};