'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('patrol_route_assignments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      patrol_route_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'patrol_routes',
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
      // Assignment details
      assignment_type: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'regular'
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'active'
      },
      // Schedule information
      recurring: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      schedule: {
        type: Sequelize.JSONB,
        defaultValue: null
      },
      start_date: {
        type: Sequelize.DATE
      },
      end_date: {
        type: Sequelize.DATE
      },
      // Assignment management
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
      override_route_requirements: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      // Performance metrics
      completion_rate: {
        type: Sequelize.FLOAT,
        defaultValue: 100
      },
      average_duration_minutes: {
        type: Sequelize.INTEGER
      },
      performance_rating: {
        type: Sequelize.INTEGER
      },
      last_patrol_date: {
        type: Sequelize.DATE
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
    await queryInterface.addIndex('patrol_route_assignments', ['patrol_route_id', 'guard_id'], { unique: true });
    await queryInterface.addIndex('patrol_route_assignments', ['guard_id']);
    await queryInterface.addIndex('patrol_route_assignments', ['status']);
    await queryInterface.addIndex('patrol_route_assignments', ['start_date']);
    await queryInterface.addIndex('patrol_route_assignments', ['end_date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('patrol_route_assignments');
  }
};