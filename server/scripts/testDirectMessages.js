const { Message, User } = require('../models');
const { Op } = require('sequelize');

async function testDirectMessages() {
  try {
    console.log('🧪 Testing Direct Messages API...');

    // Test 1: Check if messages exist in database
    const allMessages = await Message.findAll({
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    console.log(`📊 Total messages in database: ${allMessages.length}`);
    allMessages.forEach((msg, index) => {
      const receiver = msg.receiver ? `to ${msg.receiver.name}` : `to room ${msg.roomId}`;
      console.log(`  ${index + 1}. ${msg.sender.name} ${receiver}: "${msg.content.substring(0, 30)}..."`);
    });

    // Test 2: Test direct message query between specific users
    const userId1 = 5; // Current user from logs
    const userId2 = 11; // Other user from logs

    console.log(`\n🔍 Testing direct messages between User ${userId1} and User ${userId2}...`);

    const directMessages = await Message.findAndCountAll({
      where: {
        [Op.or]: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 }
        ],
        isDeleted: false
      },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name", "avatar", "role"]
        }
      ],
      order: [["createdAt", "DESC"]],
      limit: 50
    });

    console.log(`💬 Found ${directMessages.count} direct messages between them:`);
    directMessages.rows.forEach((msg, index) => {
      console.log(`  ${index + 1}. [${msg.createdAt}] ${msg.sender.name}: "${msg.content}"`);
    });

    // Test 3: Check message structure
    if (directMessages.rows.length > 0) {
      const firstMessage = directMessages.rows[0];
      console.log('\n📝 Sample message structure:');
      console.log(JSON.stringify({
        id: firstMessage.id,
        content: firstMessage.content,
        senderId: firstMessage.senderId,
        receiverId: firstMessage.receiverId,
        createdAt: firstMessage.createdAt,
        sender: firstMessage.sender
      }, null, 2));
    }

    console.log('\n✅ Direct messages test completed!');

  } catch (error) {
    console.error('❌ Direct messages test failed:', error);
  }
}

module.exports = testDirectMessages;

// Run if called directly
if (require.main === module) {
  const { sequelize } = require('../models');

  sequelize.authenticate()
    .then(() => {
      console.log('✅ Database connected');
      return testDirectMessages();
    })
    .then(() => {
      console.log('✅ Testing complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}
