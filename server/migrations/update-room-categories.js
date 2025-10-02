const { QueryInterface, DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, add the new enum values
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_CommunityRooms_category" 
      ADD VALUE IF NOT EXISTS 'mentorship';
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_CommunityRooms_category" 
      ADD VALUE IF NOT EXISTS 'goals';
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_CommunityRooms_category" 
      ADD VALUE IF NOT EXISTS 'accountability';
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_CommunityRooms_category" 
      ADD VALUE IF NOT EXISTS 'skills';
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_CommunityRooms_category" 
      ADD VALUE IF NOT EXISTS 'networking';
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_CommunityRooms_category" 
      ADD VALUE IF NOT EXISTS 'wellness';
    `);

    // Update existing rooms to use new categories
    await queryInterface.sequelize.query(`
      UPDATE "CommunityRooms" 
      SET category = 'mentorship' 
      WHERE category = 'general';
    `);
    
    await queryInterface.sequelize.query(`
      UPDATE "CommunityRooms" 
      SET category = 'support' 
      WHERE category = 'other';
    `);
    
    await queryInterface.sequelize.query(`
      UPDATE "CommunityRooms" 
      SET category = 'skills' 
      WHERE category = 'hobbies';
    `);

    // Change default value
    await queryInterface.changeColumn('CommunityRooms', 'category', {
      type: DataTypes.ENUM('mentorship', 'goals', 'accountability', 'support', 'skills', 'networking', 'wellness', 'all'),
      defaultValue: 'mentorship',
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert to old categories
    await queryInterface.sequelize.query(`
      UPDATE "CommunityRooms" 
      SET category = 'general' 
      WHERE category = 'mentorship';
    `);
    
    await queryInterface.sequelize.query(`
      UPDATE "CommunityRooms" 
      SET category = 'other' 
      WHERE category IN ('support', 'skills', 'networking', 'wellness');
    `);
    
    await queryInterface.sequelize.query(`
      UPDATE "CommunityRooms" 
      SET category = 'general' 
      WHERE category IN ('goals', 'accountability');
    `);

    // Restore original enum and default
    await queryInterface.changeColumn('CommunityRooms', 'category', {
      type: DataTypes.ENUM('general', 'support', 'goals', 'accountability', 'hobbies', 'other'),
      defaultValue: 'general',
      allowNull: false
    });
  }
};
