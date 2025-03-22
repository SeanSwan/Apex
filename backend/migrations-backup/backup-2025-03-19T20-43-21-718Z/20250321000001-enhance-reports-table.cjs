'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new fields for enhanced reporting
    await queryInterface.addColumn('reports', 'content_json', {
      type: Sequelize.JSONB,
      defaultValue: {}
    });

    await queryInterface.addColumn('reports', 'metrics', {
      type: Sequelize.JSONB,
      defaultValue: {}
    });

    await queryInterface.addColumn('reports', 'charts', {
      type: Sequelize.JSONB,
      defaultValue: []
    });

    await queryInterface.addColumn('reports', 'tables', {
      type: Sequelize.JSONB,
      defaultValue: []
    });

    // Add media attachment fields
    await queryInterface.addColumn('reports', 'photos', {
      type: Sequelize.JSONB,
      defaultValue: []
    });

    await queryInterface.addColumn('reports', 'videos', {
      type: Sequelize.JSONB,
      defaultValue: []
    });

    await queryInterface.addColumn('reports', 'documents', {
      type: Sequelize.JSONB,
      defaultValue: []
    });

    await queryInterface.addColumn('reports', 'attachments', {
      type: Sequelize.JSONB,
      defaultValue: []
    });

    // Add template and formatting fields
    await queryInterface.addColumn('reports', 'template_id', {
      type: Sequelize.UUID,
      references: {
        model: 'report_templates',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('reports', 'custom_css', {
      type: Sequelize.TEXT
    });

    await queryInterface.addColumn('reports', 'theme', {
      type: Sequelize.STRING,
      defaultValue: 'standard'
    });

    // Add delivery and access tracking fields
    await queryInterface.addColumn('reports', 'delivery_method', {
      type: Sequelize.STRING
    });

    await queryInterface.addColumn('reports', 'delivery_recipients', {
      type: Sequelize.JSONB,
      defaultValue: []
    });

    await queryInterface.addColumn('reports', 'delivery_timestamp', {
      type: Sequelize.DATE
    });

    await queryInterface.addColumn('reports', 'view_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('reports', 'download_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('reports', 'last_viewed_at', {
      type: Sequelize.DATE
    });

    // Add version control fields
    await queryInterface.addColumn('reports', 'version', {
      type: Sequelize.INTEGER,
      defaultValue: 1
    });

    await queryInterface.addColumn('reports', 'previous_version_id', {
      type: Sequelize.UUID,
      references: {
        model: 'reports',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('reports', 'revision_notes', {
      type: Sequelize.TEXT
    });

    // Add indexes for performance
    await queryInterface.addIndex('reports', ['delivery_method']);
    await queryInterface.addIndex('reports', ['version']);
    await queryInterface.addIndex('reports', ['view_count']);
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('reports', ['template_id']);
    await queryInterface.removeIndex('reports', ['delivery_method']);
    await queryInterface.removeIndex('reports', ['version']);
    await queryInterface.removeIndex('reports', ['view_count']);

    // Remove version control fields
    await queryInterface.removeColumn('reports', 'revision_notes');
    await queryInterface.removeColumn('reports', 'previous_version_id');
    await queryInterface.removeColumn('reports', 'version');

    // Remove access tracking fields
    await queryInterface.removeColumn('reports', 'last_viewed_at');
    await queryInterface.removeColumn('reports', 'download_count');
    await queryInterface.removeColumn('reports', 'view_count');
    await queryInterface.removeColumn('reports', 'delivery_timestamp');
    await queryInterface.removeColumn('reports', 'delivery_recipients');
    await queryInterface.removeColumn('reports', 'delivery_method');

    // Remove template and formatting fields
    await queryInterface.removeColumn('reports', 'theme');
    await queryInterface.removeColumn('reports', 'custom_css');
    await queryInterface.removeColumn('reports', 'template_id');

    // Remove media attachment fields
    await queryInterface.removeColumn('reports', 'attachments');
    await queryInterface.removeColumn('reports', 'documents');
    await queryInterface.removeColumn('reports', 'videos');
    await queryInterface.removeColumn('reports', 'photos');

    // Remove enhanced reporting fields
    await queryInterface.removeColumn('reports', 'tables');
    await queryInterface.removeColumn('reports', 'charts');
    await queryInterface.removeColumn('reports', 'metrics');
    await queryInterface.removeColumn('reports', 'content_json');
  }
};