// File: defense/backend/migrations/YYYYMMDDHHMMSS-create-clients.cjs
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Clients', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      siteName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      zipCode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      contactEmail: {
        type: Sequelize.STRING,
        allowNull: true,
        validate: { // Validation is primarily handled at model level, but can be noted
          isEmail: true,
        },
      },
      cameraType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      cameras: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      isVIP: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isNew: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      cameraDetails: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), // Or Sequelize.fn('NOW') depending on dialect preference
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), // Or Sequelize.fn('NOW')
      }
    });

    // Optional: Add indexes after table creation if preferred
    // await queryInterface.addIndex('Clients', ['name']);
    // await queryInterface.addIndex('Clients', ['siteName']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Clients');
  }
};