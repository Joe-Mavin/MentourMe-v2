const { sequelize } = require('../models');
const { CommunityRoom, RoomMembership, Message } = require('../models');

async function cleanupRooms() {
  try {
    console.log('🧹 Starting database cleanup...');

    // Delete all messages in rooms
    const deletedMessages = await Message.destroy({
      where: {
        roomId: {
          [require('sequelize').Op.ne]: null
        }
      }
    });
    console.log(`✅ Deleted ${deletedMessages} room messages`);

    // Delete all room memberships
    const deletedMemberships = await RoomMembership.destroy({
      where: {}
    });
    console.log(`✅ Deleted ${deletedMemberships} room memberships`);

    // Delete all community rooms (without truncate due to foreign keys)
    const deletedRooms = await CommunityRoom.destroy({
      where: {}
    });
    console.log(`✅ Deleted ${deletedRooms} community rooms`);

    // Reset auto-increment counters for MariaDB
    try {
      await sequelize.query('ALTER TABLE CommunityRooms AUTO_INCREMENT = 1');
      await sequelize.query('ALTER TABLE RoomMemberships AUTO_INCREMENT = 1');
      console.log('✅ Reset ID sequences');
    } catch (resetError) {
      console.log('⚠️ Could not reset sequences (this is okay):', resetError.message);
    }

    console.log('🎉 Database cleanup completed successfully!');
    console.log('📝 You can now create fresh rooms without any conflicts.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run the cleanup
cleanupRooms();
