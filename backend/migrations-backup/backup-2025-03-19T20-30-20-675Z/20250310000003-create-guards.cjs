'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('guards', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      badge_number: {
        type: Sequelize.STRING,
        unique: true
      },
      employee_id: {
        type: Sequelize.STRING,
        unique: true
      },
      employment_status: {
        type: Sequelize.STRING,
        defaultValue: 'full_time'
      },
      position: {
        type: Sequelize.STRING,
        defaultValue: 'security_guard'
      },
      rank: {
        type: Sequelize.STRING,
        defaultValue: 'guard'
      },
      start_date: {
        type: Sequelize.DATEONLY
      },
      end_date: {
        type: Sequelize.DATEONLY
      },
      duty_status: {
        type: Sequelize.STRING,
        defaultValue: 'off_duty'
      },
      last_clock_in: {
        type: Sequelize.DATE
      },
      last_clock_out: {
        type: Sequelize.DATE
      },
      current_property_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'properties',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      current_location_lat: {
        type: Sequelize.FLOAT
      },
      current_location_lng: {
        type: Sequelize.FLOAT
      },
      last_location_update: {
        type: Sequelize.DATE
      },
      armed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      license_number: {
        type: Sequelize.STRING
      },
      license_state: {
        type: Sequelize.STRING
      },
      license_expiry: {
        type: Sequelize.DATEONLY
      },
      license_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      firearm_license: {
        type: Sequelize.STRING
      },
      firearm_license_expiry: {
        type: Sequelize.DATEONLY
      },
      certifications: {
        type: Sequelize.TEXT
      },
      languages: {
        type: Sequelize.TEXT
      },
      special_skills: {
        type: Sequelize.TEXT
      },
      assigned_equipment: {
        type: Sequelize.TEXT
      },
      has_body_camera: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      has_radio: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      vehicle_id: {
        type: Sequelize.STRING
      },
      reliability_score: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      performance_score: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      response_time_avg: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      num_incidents_reported: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      num_patrols_completed: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      hours_worked_current_week: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      hours_worked_current_month: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      availability: {
        type: Sequelize.TEXT
      },
      preferred_shift: {
        type: Sequelize.STRING
      },
      max_hours_per_week: {
        type: Sequelize.INTEGER,
        defaultValue: 40
      },
      training_level: {
        type: Sequelize.STRING,
        defaultValue: 'basic'
      },
      training_hours_completed: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      last_training_date: {
        type: Sequelize.DATEONLY
      },
      next_training_due: {
        type: Sequelize.DATEONLY
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'active'
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
    await queryInterface.addIndex('guards', ['user_id']);
    await queryInterface.addIndex('guards', ['badge_number']);
    await queryInterface.addIndex('guards', ['employee_id']);
    await queryInterface.addIndex('guards', ['duty_status']);
    await queryInterface.addIndex('guards', ['current_property_id']);
    await queryInterface.addIndex('guards', ['status']);
    await queryInterface.addIndex('guards', ['employment_status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('guards');
  }
};