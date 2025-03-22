'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('reports', 'template_id', {
      type: Sequelize.UUID,
      references: {
        model: 'report_templates',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addIndex('reports', ['template_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('reports', ['template_id']);
    await queryInterface.removeColumn('reports', 'template_id');
  }
};