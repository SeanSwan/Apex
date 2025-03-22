'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      // Enhanced role system with hierarchy
      role: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'user'
      },
      // Personal information
      first_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone_number: {
        type: Sequelize.STRING
      },
      emergency_contact_name: {
        type: Sequelize.STRING
      },
      emergency_contact_phone: {
        type: Sequelize.STRING
      },
      // Profile and system information
      profile_image: {
        type: Sequelize.STRING
      },
      address: {
        type: Sequelize.STRING
      },
      city: {
        type: Sequelize.STRING
      },
      state: {
        type: Sequelize.STRING
      },
      zip_code: {
        type: Sequelize.STRING
      },
      date_of_birth: {
        type: Sequelize.DATEONLY
      },
      hire_date: {
        type: Sequelize.DATEONLY
      },
      employee_id: {
        type: Sequelize.STRING,
        unique: true
      },
      // Security & license information (for guards)
      security_license_number: {
        type: Sequelize.STRING
      },
      security_license_expiry: {
        type: Sequelize.DATEONLY
      },
      // Client-specific information
      company_name: {
        type: Sequelize.STRING
      },
      company_position: {
        type: Sequelize.STRING
      },
      // System access & security
      last_login: {
        type: Sequelize.DATE
      },
      reset_password_token: {
        type: Sequelize.STRING
      },
      reset_password_expires: {
        type: Sequelize.DATE
      },
      failed_login_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      account_locked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      account_locked_until: {
        type: Sequelize.DATE
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      email_verification_token: {
        type: Sequelize.STRING
      },
      two_factor_auth_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      two_factor_auth_secret: {
        type: Sequelize.STRING
      },
      // Account status
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
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
      last_active: {
        type: Sequelize.DATE
      },
      // Preferences & settings
      notifications_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      time_zone: {
        type: Sequelize.STRING,
        defaultValue: 'America/New_York'
      },
      language_preference: {
        type: Sequelize.STRING,
        defaultValue: 'en-US'
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('users', ['username'], { unique: true });
    await queryInterface.addIndex('users', ['email'], { unique: true });
    await queryInterface.addIndex('users', ['employee_id'], { unique: true });
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['status']);
    await queryInterface.addIndex('users', ['is_active']);
    await queryInterface.addIndex('users', ['security_license_expiry']);
    await queryInterface.addIndex('users', ['last_name', 'first_name']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};