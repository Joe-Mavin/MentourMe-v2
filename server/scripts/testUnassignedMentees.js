const { User, MentorshipRequest, OnboardingData } = require('../models');
const { Op } = require('sequelize');

async function testUnassignedMentees() {
  try {
    console.log('🧪 Testing getUnassignedMentees logic...');

    // Step 1: Get assigned mentee IDs
    console.log('🔍 STEP 1: Finding assigned mentees...');
    const assignedMenteeIds = await MentorshipRequest.findAll({
      where: { status: 'accepted' },
      attributes: ['menteeId'],
      raw: true
    }).then(results => results.map(r => r.menteeId));
    
    console.log(`✅ STEP 1: Found ${assignedMenteeIds.length} assigned mentees:`, assignedMenteeIds);

    // Step 2: Get unassigned mentees
    console.log('🔍 STEP 2: Finding unassigned mentees...');
    
    const unassignedMentees = await User.findAll({
      where: {
        role: 'user',
        id: {
          [Op.notIn]: assignedMenteeIds.length > 0 ? assignedMenteeIds : [0]
        }
      },
      attributes: ["id", "name", "email", "avatar", "createdAt"],
      order: [["createdAt", "DESC"]]
    });
    
    console.log(`✅ STEP 2: Found ${unassignedMentees.length} unassigned mentees`);
    
    // Step 3: Get onboarding data for each
    console.log('🔍 STEP 3: Getting onboarding data...');
    
    for (let mentee of unassignedMentees) {
      try {
        const onboardingData = await OnboardingData.findOne({
          where: { userId: mentee.id }
        });
        
        if (onboardingData) {
          console.log(`✅ Found onboarding data for user ${mentee.id} (${mentee.name})`);
          console.log(`   Goals: ${Array.isArray(onboardingData.goals) ? onboardingData.goals.join(', ') : onboardingData.goals}`);
          console.log(`   Struggles: ${Array.isArray(onboardingData.struggles) ? onboardingData.struggles.join(', ') : onboardingData.struggles}`);
        } else {
          console.log(`⚠️  No onboarding data for user ${mentee.id} (${mentee.name})`);
        }
      } catch (error) {
        console.log(`❌ Error getting onboarding data for user ${mentee.id}:`, error.message);
      }
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

module.exports = testUnassignedMentees;

// Run if called directly
if (require.main === module) {
  const { sequelize } = require('../models');
  
  sequelize.authenticate()
    .then(() => {
      console.log('✅ Database connected');
      return testUnassignedMentees();
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
