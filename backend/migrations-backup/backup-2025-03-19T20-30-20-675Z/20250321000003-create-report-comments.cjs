'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('report_comments', {
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
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      parent_comment_id: {
        type: Sequelize.UUID,
        references: {
          model: 'report_comments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      comment_type: {
        type: Sequelize.STRING,
        defaultValue: 'comment',
        allowNull: false
      },
      visibility: {
        type: Sequelize.STRING,
        defaultValue: 'all',
        allowNull: false
      },
      attachments: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'active',
        allowNull: false
      },
      is_edited: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      edited_at: {
        type: Sequelize.DATE
      },
      is_resolved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      resolved_at: {
        type: Sequelize.DATE
      },
      resolved_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
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
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('report_comments', ['report_id']);
    await queryInterface.addIndex('report_comments', ['user_id']);
    await queryInterface.addIndex('report_comments', ['parent_comment_id']);
    await queryInterface.addIndex('report_comments', ['comment_type']);
    await queryInterface.addIndex('report_comments', ['status']);
    await queryInterface.addIndex('report_comments', ['is_resolved']);
    await queryInterface.addIndex('report_comments', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('report_comments');
  }
};