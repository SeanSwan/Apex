'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First check if report_templates table exists to avoid errors
    try {
      const tableExists = await queryInterface.sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'report_templates')",
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      
      const exists = tableExists[0].exists || tableExists[0].EXISTS;
      
      if (!exists) {
        throw new Error('report_templates table does not exist!');
      }
      
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
      console.log('Successfully added template_id to reports table');
    } catch (error) {
      console.error('Error adding template_id column:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('reports', ['template_id']);
    await queryInterface.removeColumn('reports', 'template_id');
  }
};