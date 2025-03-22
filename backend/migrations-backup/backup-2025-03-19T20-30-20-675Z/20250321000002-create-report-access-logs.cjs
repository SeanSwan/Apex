'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('report_access_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      report_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'reports',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      access_type: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'view'
      },
      access_timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      ip_address: {
        type: Sequelize.STRING
      },
      user_agent: {
        type: Sequelize.STRING
      },
      device_type: {
        type: Sequelize.STRING
      },
      access_duration_seconds: {
        type: Sequelize.INTEGER
      },
      access_details: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
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
    await queryInterface.addIndex('report_access_logs', ['report_id']);
    await queryInterface.addIndex('report_access_logs', ['user_id']);
    await queryInterface.addIndex('report_access_logs', ['access_type']);
    await queryInterface.addIndex('report_access_logs', ['access_timestamp']);
    await queryInterface.addIndex('report_access_logs', ['report_id', 'access_timestamp']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('report_access_logs');
  }
};