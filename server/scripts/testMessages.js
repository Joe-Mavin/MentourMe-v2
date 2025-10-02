const { User, Message } = require('../models');
const { Op } = require('sequelize');

async function testMessages() {
  try {
    console.log('🧪 Testing Messages System...');

    // Test 1: Check if users exist
    const users = await User.findAll({ 
      where: { isActive: true },
      attributes: ['id', 'name', 'email', 'role'],
      limit: 5
    });
    
    console.log(`👥 Found ${users.length} active users:`);
    users.forEach(user => {
      console.log(`  - ${user.name} (ID: ${user.id}, Role: ${user.role})`);
    });

    if (users.length < 2) {
      console.log('❌ Need at least 2 users for testing messages');
      return;
    }

    // Test 2: Check existing messages
    const messageCount = await Message.count();
    console.log(`💬 Found ${messageCount} total messages in database`);

    // Test 3: Get recent messages
    const recentMessages = await Message.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
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
      ]
    });

    console.log(`📝 Recent messages (${recentMessages.length}):`);
    recentMessages.forEach(msg => {
      const receiver = msg.receiver ? `to ${msg.receiver.name}` : `to room ${msg.roomId}`;
      console.log(`  - ${msg.sender.name} ${receiver}: "${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}"`);
    });

    // Test 4: Test direct message query
    const user1 = users[0];
    const user2 = users[1];
    
    console.log(`\n🔍 Testing direct messages between ${user1.name} and ${user2.name}...`);
    
    const directMessages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: user1.id, receiverId: user2.id },
          { senderId: user2.id, receiverId: user1.id }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'ASC']],
      limit: 10
    });

    console.log(`💬 Found ${directMessages.length} direct messages between them`);

    // Test 5: Test conversations query
    console.log(`\n🔍 Testing conversations for ${user1.name}...`);
    
    const conversations = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: user1.id },
          { receiverId: user1.id }
        ]
      },
      attributes: ['senderId', 'receiverId', 'roomId'],
      group: ['senderId', 'receiverId', 'roomId'],
      raw: true
    });

    console.log(`💬 Found ${conversations.length} conversation threads for ${user1.name}`);

    console.log('\n🎉 Message system tests completed!');
    
  } catch (error) {
    console.error('❌ Message test failed:', error);
  }
}

module.exports = testMessages;

// Run if called directly
if (require.main === module) {
  const { sequelize, Op } = require('../models');
  
  // Make Op available in the function scope
  global.Op = Op;
  
  sequelize.authenticate()
    .then(() => {
      console.log('✅ Database connected');
      return testMessages();
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
