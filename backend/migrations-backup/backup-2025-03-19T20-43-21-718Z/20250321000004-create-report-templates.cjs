'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('report_templates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      template_type: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'standard'
      },
      report_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      client_id: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      property_id: {
        type: Sequelize.UUID,
        references: {
          model: 'properties',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_system: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      // Template structure
      structure: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      sections: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      fields: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      // Styling and branding
      header_logo_url: {
        type: Sequelize.STRING
      },
      footer_logo_url: {
        type: Sequelize.STRING
      },
      primary_color: {
        type: Sequelize.STRING,
        defaultValue: '#3366FF'
      },
      secondary_color: {
        type: Sequelize.STRING,
        defaultValue: '#FF6633'
      },
      font_family: {
        type: Sequelize.STRING,
        defaultValue: 'Arial, sans-serif'
      },
      header_html: {
        type: Sequelize.TEXT
      },
      footer_html: {
        type: Sequelize.TEXT
      },
      custom_css: {
        type: Sequelize.TEXT
      },
      // Metadata
      tags: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      version: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      previous_version_id: {
        type: Sequelize.UUID,
        references: {
          model: 'report_templates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      last_used_at: {
        type: Sequelize.DATE
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('report_templates', ['name']);
    await queryInterface.addIndex('report_templates', ['template_type']);
    await queryInterface.addIndex('report_templates', ['report_type']);
    await queryInterface.addIndex('report_templates', ['created_by']);
    await queryInterface.addIndex('report_templates', ['client_id']);
    await queryInterface.addIndex('report_templates', ['property_id']);
    await queryInterface.addIndex('report_templates', ['is_default']);
    await queryInterface.addIndex('report_templates', ['is_active']);
    await queryInterface.addIndex('report_templates', ['is_system']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('report_templates');
  }
};