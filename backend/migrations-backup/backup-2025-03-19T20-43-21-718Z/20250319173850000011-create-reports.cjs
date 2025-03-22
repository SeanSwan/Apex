'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reports', {
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
      // Basic report information
      report_number: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      report_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      report_subtype: {
        type: Sequelize.STRING
      },
      date_range_start: {
        type: Sequelize.DATEONLY
      },
      date_range_end: {
        type: Sequelize.DATEONLY
      },
      // Content
      summary: {
        type: Sequelize.TEXT
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      content_json: {
        type: Sequelize.JSONB
      },
      findings: {
        type: Sequelize.TEXT
      },
      recommendations: {
        type: Sequelize.TEXT
      },
      conclusion: {
        type: Sequelize.TEXT
      },
      // Incident details (if applicable)
      incident_id: {
        type: Sequelize.UUID,
        references: {
          model: 'incidents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      incident_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      related_incidents: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      // Patrol details (if applicable)
      patrol_id: {
        type: Sequelize.UUID,
        references: {
          model: 'patrols',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      patrol_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      related_patrols: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      // Media and attachments
      photos: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      videos: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      documents: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      attachments: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      // Statistics and metrics
      metrics: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      charts: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      tables: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      // Template and formatting
      template_id: {
        type: Sequelize.UUID,
        references: {
          model: 'report_templates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      custom_css: {
        type: Sequelize.TEXT
      },
      theme: {
        type: Sequelize.STRING,
        defaultValue: 'standard'
      },
      // Approval workflow
      approval_status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'draft'
      },
      approval_notes: {
        type: Sequelize.TEXT
      },
      approved_by: {
        type: Sequelize.UUID,
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
      // Publication status
      is_published: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      published_at: {
        type: Sequelize.DATE
      },
      published_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      expiration_date: {
        type: Sequelize.DATEONLY
      },
      // Client visibility and delivery
      client_visible: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
      delivery_status: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
      },
      delivery_method: {
        type: Sequelize.STRING
      },
      delivery_recipients: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      delivery_timestamp: {
        type: Sequelize.DATE
      },
      // Access tracking
      view_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      last_viewed_at: {
        type: Sequelize.DATE
      },
      download_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      // Version control
      version: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      previous_version_id: {
        type: Sequelize.UUID,
        references: {
          model: 'reports',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      revision_notes: {
        type: Sequelize.TEXT
      },
      // System fields
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'active'
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
    await queryInterface.addIndex('reports', ['report_number'], { unique: true });
    await queryInterface.addIndex('reports', ['property_id']);
    await queryInterface.addIndex('reports', ['created_by']);
    await queryInterface.addIndex('reports', ['report_type']);
    await queryInterface.addIndex('reports', ['approval_status']);
    await queryInterface.addIndex('reports', ['is_published']);
    await queryInterface.addIndex('reports', ['client_id']);
    await queryInterface.addIndex('reports', ['incident_id']);
    await queryInterface.addIndex('reports', ['patrol_id']);
    await queryInterface.addIndex('reports', ['date_range_start', 'date_range_end']);
    await queryInterface.addIndex('reports', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reports');
  }
};