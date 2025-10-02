const { sequelize } = require('../models');
const { CommunityRoom } = require('../models');

async function fixRoomSchema() {
  try {
    console.log('🔧 Checking and fixing room schema...');

    // Force sync the CommunityRoom model to update the schema
    await CommunityRoom.sync({ alter: true });
    console.log('✅ CommunityRoom schema updated');

    // Test creating a room with long content
    const testRoom = {
      name: 'Test Room Schema',
      description: 'This is a test description that is longer than usual to make sure the database can handle longer text content without truncation issues.',
      createdBy: 1,
      isPrivate: false,
      maxMembers: 50,
      category: 'mentorship',
      rules: 'Be respectful and supportive. Share experiences constructively. Keep discussions focused on growth and learning. Maintain confidentiality when sharing personal challenges. This is a longer rules text to test the schema.',
      isActive: true,
      lastActivity: new Date()
    };

    console.log('🧪 Testing room creation with long content...');
    const createdRoom = await CommunityRoom.create(testRoom);
    console.log('✅ Test room created successfully:', createdRoom.id);

    // Clean up test room
    await createdRoom.destroy();
    console.log('✅ Test room cleaned up');

    console.log('🎉 Schema fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run the fix
fixRoomSchema();
