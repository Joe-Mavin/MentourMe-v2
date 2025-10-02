const { sequelize, User, OnboardingData } = require('../models');

async function checkDatabase() {
  try {
    console.log('🔍 Checking database structure...');
    
    // Test basic connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Available tables:', tables);
    
    // Check User table structure
    const userAttributes = await sequelize.getQueryInterface().describeTable('users');
    console.log('👤 User table structure:', Object.keys(userAttributes));
    
    // Check if onboardingdata table exists
    const onboardingTable = tables.find(t => 
      t.tableName && t.tableName.toLowerCase() === 'onboardingdata'
    );
    
    if (onboardingTable) {
      console.log(`📊 Found onboarding table: ${onboardingTable.tableName}`);
      
      const onboardingAttributes = await sequelize.getQueryInterface().describeTable(onboardingTable.tableName);
      console.log('📊 Onboarding table structure:', Object.keys(onboardingAttributes));
    } else {
      console.log('❌ OnboardingData table not found!');
      console.log('Available table names:', tables.map(t => t.tableName || t));
    }
    
    // Test simple queries
    const userCount = await User.count();
    console.log(`👥 Total users: ${userCount}`);
    
    const menteeCount = await User.count({ where: { role: 'user' } });
    console.log(`🎓 Total mentees: ${menteeCount}`);
    
    const mentorCount = await User.count({ where: { role: 'mentor' } });
    console.log(`👨‍🏫 Total mentors: ${mentorCount}`);
    
    // Test OnboardingData query
    try {
      const onboardingCount = await OnboardingData.count();
      console.log(`📋 Total onboarding records: ${onboardingCount}`);
      
      // Get a sample record
      const sampleRecord = await OnboardingData.findOne();
      if (sampleRecord) {
        console.log('📋 Sample onboarding record:', {
          id: sampleRecord.id,
          userId: sampleRecord.userId,
          goals: typeof sampleRecord.goals,
          struggles: typeof sampleRecord.struggles,
          preferredCommunicationStyle: sampleRecord.preferredCommunicationStyle,
          experience: typeof sampleRecord.experience
        });
      }
    } catch (error) {
      console.log('❌ Error querying OnboardingData:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await sequelize.close();
  }
}

checkDatabase();
