'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // First check if tables exist
      const checkTablesQuery = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'report_templates')";
      const templatesExist = await queryInterface.sequelize.query(checkTablesQuery, { 
        type: queryInterface.sequelize.QueryTypes.SELECT 
      });
      
      // Get the exists value (PostgreSQL returns lowercase, some others uppercase)
      const templateTableExists = templatesExist[0].exists || templatesExist[0].EXISTS;
      
      if (!templateTableExists) {
        console.error('report_templates table does not exist! Skipping template_id addition.');
        return;
      }
      
      // Check if reports table exists
      const reportsExistQuery = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reports')";
      const reportsExist = await queryInterface.sequelize.query(reportsExistQuery, { 
        type: queryInterface.sequelize.QueryTypes.SELECT 
      });
      
      // Get the exists value
      const reportsTableExists = reportsExist[0].exists || reportsExist[0].EXISTS;
      
      if (!reportsTableExists) {
        console.error('reports table does not exist! Skipping template_id addition.');
        return;
      }
      
      // Check if column already exists
      const columnExistsQuery = "SELECT column_name FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'template_id'";
      const columnExists = await queryInterface.sequelize.query(columnExistsQuery, {
        type: queryInterface.sequelize.QueryTypes.SELECT
      });
      
      if (columnExists.length > 0) {
        console.log('template_id column already exists, skipping addition...');
        return;
      }
      
      // Add the column with foreign key reference
      console.log('Adding template_id column to reports table...');
      await queryInterface.addColumn('reports', 'template_id', {
        type: Sequelize.UUID,
        references: {
          model: 'report_templates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      
      // Add index
      console.log('Adding index for template_id...');
      await queryInterface.addIndex('reports', ['template_id']);
      console.log('Successfully added template_id column and index to reports table');
    } catch (error) {
      console.error('Error in migration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Check if column exists before trying to remove
      const columnExistsQuery = "SELECT column_name FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'template_id'";
      const columnExists = await queryInterface.sequelize.query(columnExistsQuery, {
        type: queryInterface.sequelize.QueryTypes.SELECT
      });
      
      if (columnExists.length === 0) {
        console.log('template_id column does not exist, skipping removal...');
        return;
      }
      
      // Remove index
      try {
        await queryInterface.removeIndex('reports', ['template_id']);
      } catch (indexError) {
        console.log('Could not remove index, it may not exist:', indexError.message);
      }
      
      // Remove column
      await queryInterface.removeColumn('reports', 'template_id');
    } catch (error) {
      console.error('Error in migration reversion:', error);
      throw error;
    }
  }
};