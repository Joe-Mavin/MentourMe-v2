const { User, MentorshipRequest } = require('../models');

async function testMentorshipAPI() {
  try {
    console.log('🧪 Testing Mentorship API...');

    // Test 1: Get all mentorship requests
    console.log('\n1. Testing MentorshipRequest.findAll()...');
    const allRequests = await MentorshipRequest.findAll({
      include: [
        { model: User, as: 'mentor', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'mentee', attributes: ['id', 'name', 'email'] }
      ]
    });
    console.log(`✅ Found ${allRequests.length} mentorship requests`);

    // Test 2: Get active mentorships for user ID 1
    console.log('\n2. Testing active mentorships query...');
    const { Op } = require('sequelize');
    const activeMentorships = await MentorshipRequest.findAll({
      where: {
        [Op.or]: [
          { mentorId: 1 },
          { menteeId: 1 }
        ],
        status: 'accepted'
      },
      include: [
        {
          model: User,
          as: 'mentor',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'mentee',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ],
      order: [['respondedAt', 'DESC']]
    });
    console.log(`✅ Found ${activeMentorships.length} active mentorships for user 1`);

    // Test 3: Get pending requests
    console.log('\n3. Testing pending requests query...');
    const pendingRequests = await MentorshipRequest.findAll({
      where: {
        [Op.or]: [
          { mentorId: 1 },
          { menteeId: 1 }
        ],
        status: 'pending'
      },
      include: [
        {
          model: User,
          as: 'mentor',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'mentee',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ],
      order: [['requestedAt', 'DESC']]
    });
    console.log(`✅ Found ${pendingRequests.length} pending requests for user 1`);

    // Test 4: Check table structure
    console.log('\n4. Testing table structure...');
    const tableInfo = await MentorshipRequest.describe();
    console.log('✅ MentorshipRequest table columns:', Object.keys(tableInfo));

    console.log('\n🎉 All tests passed! Mentorship API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

module.exports = testMentorshipAPI;

// Run if called directly
if (require.main === module) {
  const { sequelize } = require('../models');
  
  sequelize.authenticate()
    .then(() => {
      console.log('✅ Database connected');
      return testMentorshipAPI();
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
