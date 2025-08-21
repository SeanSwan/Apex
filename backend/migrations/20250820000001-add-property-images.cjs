/**
 * APEX AI SECURITY PLATFORM - Property Images Migration
 * =====================================================
 * Adds image management capabilities to Properties table
 * Features: Multiple images per property, primary image designation, organized storage
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Properties', 'property_images', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: '[]',
      comment: 'Array of property image metadata objects with filename, path, uploadDate, description'
    });

    await queryInterface.addColumn('Properties', 'primary_image', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'Primary property image filename for thumbnails and main display'
    });

    await queryInterface.addColumn('Properties', 'image_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total number of images uploaded for this property'
    });

    await queryInterface.addColumn('Properties', 'images_last_updated', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp of the last image upload or modification'
    });

    // Create indexes for better performance
    await queryInterface.addIndex('Properties', ['primary_image']);
    await queryInterface.addIndex('Properties', ['image_count']);
    await queryInterface.addIndex('Properties', ['images_last_updated']);
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('Properties', ['images_last_updated']);
    await queryInterface.removeIndex('Properties', ['image_count']);
    await queryInterface.removeIndex('Properties', ['primary_image']);
    
    // Remove columns
    await queryInterface.removeColumn('Properties', 'images_last_updated');
    await queryInterface.removeColumn('Properties', 'image_count');
    await queryInterface.removeColumn('Properties', 'primary_image');
    await queryInterface.removeColumn('Properties', 'property_images');
  }
};
