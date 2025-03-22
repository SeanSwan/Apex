'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('checkpoints', {
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
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      checkpoint_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT
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
      location_details: {
        type: Sequelize.TEXT
      },
      // Geographic coordinates
      latitude: {
        type: Sequelize.FLOAT,
        validate: {
          min: -90,
          max: 90
        }
      },
      longitude: {
        type: Sequelize.FLOAT,
        validate: {
          min: -180,
          max: 180
        }
      },
      // Indoor coordinates (on floor plan)
      indoor_x: {
        type: Sequelize.FLOAT
      },
      indoor_y: {
        type: Sequelize.FLOAT
      },
      // Type and verification details
      checkpoint_type: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'standard'
      },
      verification_method: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'qr_code'
      },
      verification_data: {
        type: Sequelize.STRING
      },
      // Patrol and verification requirements
      scan_frequency_hours: {
        type: Sequelize.FLOAT,
        defaultValue: 24.0
      },
      required_actions: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      optional_actions: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      requires_photo: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      requires_note: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      special_instructions: {
        type: Sequelize.TEXT
      },
      // Verification status
      last_scanned: {
        type: Sequelize.DATE
      },
      last_scanned_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      last_scan_status: {
        type: Sequelize.STRING
      },
      last_scan_note: {
        type: Sequelize.TEXT
      },
      last_scan_photo: {
        type: Sequelize.STRING
      },
      next_scan_due: {
        type: Sequelize.DATE
      },
      // Status and compliance
      compliance_status: {
        type: Sequelize.STRING,
        defaultValue: 'compliant'
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'active'
      },
      // Routes and tasks
      patrol_routes: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      order_in_routes: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      assigned_tasks: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      // Hazard and safety
      potential_hazards: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      safety_instructions: {
        type: Sequelize.TEXT
      },
      // Associated items
      associated_equipment: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      associated_access_points: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      associated_cameras: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      // System fields
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('checkpoints', ['checkpoint_code'], { unique: true });
    await queryInterface.addIndex('checkpoints', ['property_id']);
    await queryInterface.addIndex('checkpoints', ['zone_id']);
    await queryInterface.addIndex('checkpoints', ['status']);
    await queryInterface.addIndex('checkpoints', ['compliance_status']);
    await queryInterface.addIndex('checkpoints', ['next_scan_due']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('checkpoints');
  }
};