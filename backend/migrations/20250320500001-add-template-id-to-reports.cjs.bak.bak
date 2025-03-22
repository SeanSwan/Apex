'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Check if the reports table exists
      const reportsTableExists = await queryInterface.sequelize.query(
        "SELECT to_regclass('public.reports')",
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      
      if (!reportsTableExists[0].to_regclass) {
        console.log('Reports table does not exist yet, skipping template_id addition');
        return;
      }
      
      // Check if the report_templates table exists
      const templatesTableExists = await queryInterface.sequelize.query(
        "SELECT to_regclass('public.report_templates')",
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      
      if (!templatesTableExists[0].to_regclass) {
        console.log('Report templates table does not exist yet, skipping template_id addition');
        return;
      }
      
      // Check if template_id column already exists
      const columns = await queryInterface.sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'template_id'",
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      
      if (columns.length > 0) {
        console.log('template_id column already exists, skipping');
        return;
      }
      
      // Add the column with the foreign key
      await queryInterface.addColumn('reports', 'template_id', {
        type: Sequelize.UUID,
        references: {
          model: 'report_templates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      
      // Add the index
      await queryInterface.addIndex('reports', ['template_id']);
      
      console.log('Successfully added template_id to reports table');
    } catch (error) {
      console.error('Error in migration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Check if the template_id column exists before trying to remove it
      const columns = await queryInterface.sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'template_id'",
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      
      if (columns.length === 0) {
        console.log('template_id column does not exist, skipping');
        return;
      }
      
      // Remove the index first
      try {
        await queryInterface.removeIndex('reports', ['template_id']);
      } catch (error) {
        console.log('Could not remove index, it might not exist:', error.message);
      }
      
      // Remove the column
      await queryInterface.removeColumn('reports', 'template_id');
    } catch (error) {
      console.error('Error in migration reversion:', error);
      throw error;
    }
  }
};