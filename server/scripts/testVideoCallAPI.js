const { User, MentorshipRequest } = require('../models');
const { initiateCall } = require('../controllers/videoCallController');

async function testVideoCallAPI() {
  try {
    console.log('🧪 Testing Video Call API...');

    // Find users with active mentorship
    const mentorship = await MentorshipRequest.findOne({
      where: { status: 'accepted' },
      include: [
        { model: User, as: 'mentor', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'mentee', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!mentorship) {
      console.log('❌ No active mentorship found');
      return;
    }

    console.log(`✅ Found mentorship: ${mentorship.mentor.name} -> ${mentorship.mentee.name}`);

    // Mock request and response objects
    const mockReq = {
      user: { id: mentorship.menteeId, name: mentorship.mentee.name },
      body: {
        targetUserId: mentorship.mentorId,
        callType: 'video',
        purpose: 'goal_review',
        sessionType: 'mentorship'
      },
      app: {
        get: (key) => {
          if (key === 'socketService') {
            return {
              emitIncomingCall: (userId, data) => {
                console.log(`📞 Socket notification sent to user ${userId}:`, data);
              }
            };
          }
          return null;
        }
      }
    };

    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`📤 Response (${code}):`, JSON.stringify(data, null, 2));
        }
      }),
      json: (data) => {
        console.log('📤 Response (200):', JSON.stringify(data, null, 2));
      }
    };

    // Test the initiateCall function
    console.log('\n🚀 Testing initiateCall...');
    await initiateCall(mockReq, mockRes);

    console.log('\n🎉 Video Call API test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

module.exports = testVideoCallAPI;

// Run if called directly
if (require.main === module) {
  const { sequelize } = require('../models');
  
  sequelize.authenticate()
    .then(() => {
      console.log('✅ Database connected');
      return testVideoCallAPI();
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
