'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('daily_activity_reports', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      guard_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'guards',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      property_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'properties',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      report_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      shift_start: {
        type: Sequelize.DATE,
        allowNull: false
      },
      shift_end: {
        type: Sequelize.DATE
      },
      weather_conditions: {
        type: Sequelize.STRING
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      activities: {
        type: Sequelize.TEXT
      },
      incidents_reported: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      visitors_processed: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      patrols_completed: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      maintenance_issues: {
        type: Sequelize.TEXT
      },
      parking_violations: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'draft'
      },
      approved_by_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      approved_at: {
        type: Sequelize.DATE
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });
    
    // Add indexes for performance
    await queryInterface.addIndex('daily_activity_reports', ['guard_id']);
    await queryInterface.addIndex('daily_activity_reports', ['property_id']);
    await queryInterface.addIndex('daily_activity_reports', ['report_date']);
    await queryInterface.addIndex('daily_activity_reports', ['status']);
    await queryInterface.addIndex('daily_activity_reports', ['approved_by_id']);
    
    // Add a unique constraint to prevent duplicate reports for the same guard, property, and date
    await queryInterface.addConstraint('daily_activity_reports', {
      fields: ['guard_id', 'property_id', 'report_date'],
      type: 'unique',
      name: 'unique_daily_report_per_guard_property_date'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('daily_activity_reports');
  }
};