const { User, MentorshipRequest, OnboardingData } = require('../models');

async function seedMentorshipData() {
  try {
    console.log('🌱 Seeding mentorship data...');

    // Find existing users
    const users = await User.findAll();
    const mentors = users.filter(u => u.role === 'mentor' && u.approved);
    const mentees = users.filter(u => u.role === 'user');

    console.log(`Found ${mentors.length} mentors and ${mentees.length} mentees`);

    if (mentors.length === 0 || mentees.length === 0) {
      console.log('❌ Need at least 1 mentor and 1 mentee to create sample data');
      return;
    }

    // Create some sample mentorship requests
    const sampleRequests = [
      {
        mentorId: mentors[0].id,
        menteeId: mentees[0].id,
        status: 'accepted',
        message: 'I would love to learn from your experience in software development!',
        mentorNotes: 'Happy to help with your career growth!',
        requestedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        respondedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        matchScore: 8.5
      }
    ];

    // Add more requests if we have more users
    if (mentors.length > 1 && mentees.length > 1) {
      sampleRequests.push({
        mentorId: mentors[1] ? mentors[1].id : mentors[0].id,
        menteeId: mentees[1] ? mentees[1].id : mentees[0].id,
        status: 'pending',
        message: 'I am interested in learning about project management and leadership.',
        requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        matchScore: 7.2
      });
    }

    // Create the requests
    for (const requestData of sampleRequests) {
      const existingRequest = await MentorshipRequest.findOne({
        where: {
          mentorId: requestData.mentorId,
          menteeId: requestData.menteeId
        }
      });

      if (!existingRequest) {
        await MentorshipRequest.create(requestData);
        console.log(`✅ Created mentorship request: ${requestData.status}`);
      } else {
        console.log(`⏭️  Mentorship request already exists`);
      }
    }

    console.log('🎉 Mentorship data seeding completed!');

  } catch (error) {
    console.error('❌ Error seeding mentorship data:', error);
  }
}

module.exports = seedMentorshipData;

// Run if called directly
if (require.main === module) {
  const { sequelize } = require('../models');
  
  sequelize.authenticate()
    .then(() => {
      console.log('✅ Database connected');
      return seedMentorshipData();
    })
    .then(() => {
      console.log('✅ Seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}
