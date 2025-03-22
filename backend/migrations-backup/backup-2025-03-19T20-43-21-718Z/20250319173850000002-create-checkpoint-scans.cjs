'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('checkpoint_scans', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      patrol_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'patrols',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      checkpoint_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'checkpoints',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      guard_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      // Scan details
      scan_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      sequence_number: {
        type: Sequelize.INTEGER
      },
      scheduled_time: {
        type: Sequelize.DATE
      },
      // Verification methods
      verification_method: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'qr_code'
      },
      verification_data: {
        type: Sequelize.STRING
      },
      verification_successful: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      // Location tracking
      latitude: {
        type: Sequelize.FLOAT
      },
      longitude: {
        type: Sequelize.FLOAT
      },
      accuracy_meters: {
        type: Sequelize.FLOAT
      },
      gps_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      location_deviation_meters: {
        type: Sequelize.FLOAT
      },
      // Compliance checks
      on_time: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      time_deviation_minutes: {
        type: Sequelize.INTEGER
      },
      completed_actions: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      skipped_actions: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      action_compliance: {
        type: Sequelize.FLOAT,
        defaultValue: 100
      },
      // Status and results
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'completed'
      },
      issue_reported: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      issue_type: {
        type: Sequelize.STRING
      },
      issue_description: {
        type: Sequelize.TEXT
      },
      issue_severity: {
        type: Sequelize.STRING
      },
      reported_incident_id: {
        type: Sequelize.UUID,
        references: {
          model: 'incidents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      reported_maintenance_id: {
        type: Sequelize.UUID,
        references: {
          model: 'maintenance_requests',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      // Notes and documentation
      notes: {
        type: Sequelize.TEXT
      },
      photos: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      videos: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      // Device information
      device_id: {
        type: Sequelize.STRING
      },
      device_type: {
        type: Sequelize.STRING
      },
      app_version: {
        type: Sequelize.STRING
      },
      battery_level: {
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
    await queryInterface.addIndex('checkpoint_scans', ['patrol_id']);
    await queryInterface.addIndex('checkpoint_scans', ['checkpoint_id']);
    await queryInterface.addIndex('checkpoint_scans', ['guard_id']);
    await queryInterface.addIndex('checkpoint_scans', ['property_id']);
    await queryInterface.addIndex('checkpoint_scans', ['scan_time']);
    await queryInterface.addIndex('checkpoint_scans', ['status']);
    await queryInterface.addIndex('checkpoint_scans', ['issue_reported']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('checkpoint_scans');
  }
};