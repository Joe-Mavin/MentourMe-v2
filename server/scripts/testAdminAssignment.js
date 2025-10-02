const { User, MentorshipRequest } = require('../models');
const notificationService = require('../services/notificationService');

async function testAdminAssignment() {
  try {
    console.log('🧪 Testing Admin Assignment and Notifications...');

    // Find a mentor and mentee for testing
    const mentor = await User.findOne({ 
      where: { role: 'mentor', approved: true } 
    });
    
    const mentee = await User.findOne({ 
      where: { role: 'user' } 
    });

    if (!mentor || !mentee) {
      console.log('❌ Need at least 1 mentor and 1 mentee for testing');
      return;
    }

    console.log(`👨‍🏫 Found mentor: ${mentor.name} (ID: ${mentor.id})`);
    console.log(`🎓 Found mentee: ${mentee.name} (ID: ${mentee.id})`);

    // Check if there's already an assignment
    const existingAssignment = await MentorshipRequest.findOne({
      where: {
        mentorId: mentor.id,
        menteeId: mentee.id,
        status: 'accepted'
      }
    });

    if (existingAssignment) {
      console.log('✅ Assignment already exists - testing notifications only');
      
      // Test notifications
      try {
        await notificationService.createNotification({
          userId: mentor.id,
          type: 'mentorship_assigned',
          title: 'Test Notification - New Mentee Assigned! 👥',
          message: `Admin has assigned ${mentee.name} as your mentee`,
          priority: 'high',
          actionUrl: `/mentorship/dashboard`,
          data: { menteeId: mentee.id, menteeName: mentee.name, assignedBy: 'admin' }
        });

        console.log('✅ Notification sent to mentor');

        await notificationService.createNotification({
          userId: mentee.id,
          type: 'mentorship_assigned',
          title: 'Test Notification - Mentor Assigned! 🎯',
          message: `Admin has assigned ${mentor.name} as your mentor`,
          priority: 'high',
          actionUrl: `/mentorship/dashboard`,
          data: { mentorId: mentor.id, mentorName: mentor.name, assignedBy: 'admin' }
        });

        console.log('✅ Notification sent to mentee');
      } catch (notificationError) {
        console.error('❌ Notification test failed:', notificationError);
      }
    } else {
      console.log('📝 Creating new assignment...');
      
      // Create assignment
      const assignment = await MentorshipRequest.create({
        mentorId: mentor.id,
        menteeId: mentee.id,
        status: "accepted",
        message: "Test admin assignment",
        mentorNotes: "Test assignment by script",
        respondedAt: new Date(),
        requestedAt: new Date()
      });

      console.log('✅ Assignment created:', assignment.id);

      // Test notifications
      try {
        await notificationService.createNotification({
          userId: mentor.id,
          type: 'mentorship_assigned',
          title: 'New Mentee Assigned! 👥',
          message: `Admin has assigned ${mentee.name} as your mentee`,
          priority: 'high',
          actionUrl: `/mentorship/dashboard`,
          data: { menteeId: mentee.id, menteeName: mentee.name, assignedBy: 'admin' }
        });

        console.log('✅ Notification sent to mentor');

        await notificationService.createNotification({
          userId: mentee.id,
          type: 'mentorship_assigned',
          title: 'Mentor Assigned! 🎯',
          message: `Admin has assigned ${mentor.name} as your mentor`,
          priority: 'high',
          actionUrl: `/mentorship/dashboard`,
          data: { mentorId: mentor.id, mentorName: mentor.name, assignedBy: 'admin' }
        });

        console.log('✅ Notification sent to mentee');
      } catch (notificationError) {
        console.error('❌ Notification failed:', notificationError);
      }
    }

    // Test getting active mentorships for mentor
    console.log('\n🔍 Testing active mentorships query for mentor...');
    const mentorMentorships = await MentorshipRequest.findAll({
      where: { 
        mentorId: mentor.id,
        status: 'accepted' 
      },
      include: [
        {
          model: User,
          as: "mentor",
          attributes: ["id", "name", "email", "avatar"]
        },
        {
          model: User,
          as: "mentee",
          attributes: ["id", "name", "email", "avatar"]
        }
      ]
    });

    console.log(`✅ Found ${mentorMentorships.length} active mentorships for mentor ${mentor.name}`);

    // Test getting active mentorships for mentee
    console.log('\n🔍 Testing active mentorships query for mentee...');
    const menteeMentorships = await MentorshipRequest.findAll({
      where: { 
        menteeId: mentee.id,
        status: 'accepted' 
      },
      include: [
        {
          model: User,
          as: "mentor",
          attributes: ["id", "name", "email", "avatar"]
        },
        {
          model: User,
          as: "mentee",
          attributes: ["id", "name", "email", "avatar"]
        }
      ]
    });

    console.log(`✅ Found ${menteeMentorships.length} active mentorships for mentee ${mentee.name}`);

    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

module.exports = testAdminAssignment;

// Run if called directly
if (require.main === module) {
  const { sequelize } = require('../models');
  
  sequelize.authenticate()
    .then(() => {
      console.log('✅ Database connected');
      return testAdminAssignment();
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
