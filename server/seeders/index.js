require("dotenv").config();
const { sequelize, User, OnboardingData, CommunityRoom, RoomMembership } = require("../models");

async function createUsers() {
  const users = [
    {
      name: "Admin User",
      email: "admin@mentourme.com",
      password: "Admin123!",
      role: "admin",
      approved: true,
      isActive: true
    },
    {
      name: "John Mentor",
      email: "john.mentor@example.com",
      password: "Mentor123!",
      role: "mentor",
      approved: true,
      isActive: true,
      phone: "+1234567890"
    },
    {
      name: "Sarah Coach",
      email: "sarah.coach@example.com",
      password: "Coach123!",
      role: "mentor",
      approved: true,
      isActive: true,
      phone: "+1234567891"
    },
    {
      name: "Mike Pending",
      email: "mike.pending@example.com",
      password: "Pending123!",
      role: "mentor",
      approved: false,
      isActive: true
    },
    {
      name: "Alice Johnson",
      email: "alice@example.com",
      password: "User123!",
      role: "user",
      approved: true,
      isActive: true
    },
    {
      name: "Bob Smith",
      email: "bob@example.com",
      password: "User123!",
      role: "user",
      approved: true,
      isActive: true
    },
    {
      name: "Carol Davis",
      email: "carol@example.com",
      password: "User123!",
      role: "user",
      approved: true,
      isActive: true
    },
    {
      name: "David Wilson",
      email: "david@example.com",
      password: "User123!",
      role: "user",
      approved: true,
      isActive: true
    }
  ];

  const createdUsers = [];
  for (const userData of users) {
    try {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.name} (${user.role})`);
    } catch (error) {
      console.log(`⚠️  User ${userData.email} already exists or error:`, error.message);
    }
  }

  return createdUsers;
}

async function createOnboardingData(users) {
  const onboardingData = [
    {
      userId: users.find(u => u.email === "john.mentor@example.com")?.id,
      age: 35,
      goals: ["Help others overcome addiction", "Build confidence", "Career mentoring"],
      struggles: ["Time management", "Work-life balance"],
      availability: {
        monday: ["18:00", "20:00"],
        wednesday: ["19:00", "21:00"],
        saturday: ["10:00", "16:00"]
      },
      timeZone: "America/New_York",
      preferredCommunicationStyle: "supportive",
      experience: "5 years of mentoring experience, background in psychology and addiction recovery",
      interests: ["fitness", "reading", "meditation"]
    },
    {
      userId: users.find(u => u.email === "sarah.coach@example.com")?.id,
      age: 28,
      goals: ["Career coaching", "Leadership development", "Goal setting"],
      struggles: ["Perfectionism"],
      availability: {
        tuesday: ["17:00", "19:00"],
        thursday: ["17:00", "19:00"],
        sunday: ["14:00", "17:00"]
      },
      timeZone: "America/Los_Angeles",
      preferredCommunicationStyle: "motivational",
      experience: "3 years of professional coaching, certified life coach",
      interests: ["entrepreneurship", "yoga", "travel"]
    },
    {
      userId: users.find(u => u.email === "alice@example.com")?.id,
      age: 24,
      goals: ["Overcome social anxiety", "Build self-confidence", "Career development"],
      struggles: ["Social anxiety", "Procrastination", "Self-doubt"],
      availability: {
        monday: ["19:00", "21:00"],
        wednesday: ["19:00", "21:00"],
        friday: ["20:00", "22:00"]
      },
      timeZone: "America/Chicago",
      preferredCommunicationStyle: "supportive",
      interests: ["art", "music", "psychology"]
    },
    {
      userId: users.find(u => u.email === "bob@example.com")?.id,
      age: 31,
      goals: ["Break addiction habits", "Improve relationships", "Get fit"],
      struggles: ["Addiction recovery", "Relationship issues"],
      availability: {
        tuesday: ["18:00", "20:00"],
        saturday: ["09:00", "12:00"],
        sunday: ["09:00", "12:00"]
      },
      timeZone: "America/New_York",
      preferredCommunicationStyle: "direct",
      interests: ["sports", "cooking", "music"]
    },
    {
      userId: users.find(u => u.email === "carol@example.com")?.id,
      age: 27,
      goals: ["Build healthy habits", "Stress management", "Work-life balance"],
      struggles: ["Stress", "Time management", "Burnout"],
      availability: {
        weekdays: ["17:00", "19:00"],
        saturday: ["10:00", "14:00"]
      },
      timeZone: "America/Denver",
      preferredCommunicationStyle: "analytical",
      interests: ["meditation", "hiking", "reading"]
    }
  ];

  for (const data of onboardingData) {
    if (data.userId) {
      try {
        await OnboardingData.create({
          ...data,
          completedAt: new Date()
        });
        console.log(`✅ Created onboarding data for user ID: ${data.userId}`);
      } catch (error) {
        console.log(`⚠️  Onboarding data for user ${data.userId} already exists`);
      }
    }
  }
}

async function createCommunityRooms(users) {
  const adminUser = users.find(u => u.role === "admin");
  const mentorUser = users.find(u => u.role === "mentor" && u.approved);

  const rooms = [
    {
      name: "General Discussion",
      description: "Welcome to MentourMe! Introduce yourself and connect with others.",
      category: "general",
      isPrivate: false,
      maxMembers: 100,
      createdBy: adminUser?.id,
      rules: "Be respectful, supportive, and kind to all members. No spam or inappropriate content."
    },
    {
      name: "Addiction Recovery Support",
      description: "A safe space for those on their recovery journey to share, support, and encourage each other.",
      category: "support",
      isPrivate: false,
      maxMembers: 50,
      createdBy: mentorUser?.id,
      rules: "Maintain confidentiality and respect. Share your experiences and support others without judgment."
    },
    {
      name: "Goal Setting & Achievement",
      description: "Set goals, track progress, and celebrate achievements together.",
      category: "goals",
      isPrivate: false,
      maxMembers: 75,
      createdBy: adminUser?.id,
      rules: "Share your goals and progress. Offer constructive feedback and encouragement."
    },
    {
      name: "Accountability Partners",
      description: "Find your accountability partner and stay committed to your journey.",
      category: "accountability",
      isPrivate: false,
      maxMembers: 30,
      createdBy: mentorUser?.id,
      rules: "Be honest about your progress. Check in regularly with your accountability partner."
    },
    {
      name: "Mentors' Lounge",
      description: "Private space for mentors to discuss strategies, share resources, and support each other.",
      category: "other",
      isPrivate: true,
      maxMembers: 20,
      createdBy: adminUser?.id,
      rules: "Mentor-only space. Share resources, discuss best practices, and support fellow mentors."
    }
  ];

  const createdRooms = [];
  for (const roomData of rooms) {
    if (roomData.createdBy) {
      try {
        const room = await CommunityRoom.create(roomData);
        createdRooms.push(room);
        console.log(`✅ Created room: ${room.name}`);

        // Add creator as admin member
        await RoomMembership.create({
          userId: roomData.createdBy,
          roomId: room.id,
          role: "admin"
        });

      } catch (error) {
        console.log(`⚠️  Room ${roomData.name} already exists or error:`, error.message);
      }
    }
  }

  return createdRooms;
}

async function addRoomMembers(users, rooms) {
  // Add all active users to General Discussion
  const generalRoom = rooms.find(r => r.name === "General Discussion");
  if (generalRoom) {
    for (const user of users.filter(u => u.isActive && u.role !== "admin")) {
      try {
        await RoomMembership.create({
          userId: user.id,
          roomId: generalRoom.id,
          role: "member"
        });
      } catch (error) {
        // Membership might already exist
      }
    }
  }

  // Add users with addiction-related struggles to support room
  const supportRoom = rooms.find(r => r.name === "Addiction Recovery Support");
  if (supportRoom) {
    const targetUsers = users.filter(u => 
      u.email === "bob@example.com" || 
      (u.role === "mentor" && u.approved)
    );
    
    for (const user of targetUsers) {
      try {
        await RoomMembership.create({
          userId: user.id,
          roomId: supportRoom.id,
          role: "member"
        });
      } catch (error) {
        // Membership might already exist
      }
    }
  }

  // Add goal-oriented users to goal setting room
  const goalsRoom = rooms.find(r => r.name === "Goal Setting & Achievement");
  if (goalsRoom) {
    const targetUsers = users.filter(u => 
      ["alice@example.com", "carol@example.com"].includes(u.email) ||
      u.role === "mentor"
    );
    
    for (const user of targetUsers) {
      try {
        await RoomMembership.create({
          userId: user.id,
          roomId: goalsRoom.id,
          role: "member"
        });
      } catch (error) {
        // Membership might already exist
      }
    }
  }

  // Add all approved mentors to Mentors' Lounge
  const mentorsRoom = rooms.find(r => r.name === "Mentors' Lounge");
  if (mentorsRoom) {
    const mentors = users.filter(u => u.role === "mentor" && u.approved);
    
    for (const mentor of mentors) {
      try {
        await RoomMembership.create({
          userId: mentor.id,
          roomId: mentorsRoom.id,
          role: "member"
        });
      } catch (error) {
        // Membership might already exist
      }
    }
  }

  console.log("✅ Added room memberships");
}

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Ensure database is connected
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Sync database
    await sequelize.sync({ alter: true });
    console.log("✅ Database synchronized");

    // Create users
    console.log("\n👥 Creating users...");
    const users = await createUsers();

    // Create onboarding data
    console.log("\n📝 Creating onboarding data...");
    await createOnboardingData(users);

    // Create community rooms
    console.log("\n🏠 Creating community rooms...");
    const rooms = await createCommunityRooms(users);

    // Add room members
    console.log("\n👥 Adding room members...");
    await addRoomMembers(users, rooms);

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   • ${users.length} users created`);
    console.log(`   • ${rooms.length} community rooms created`);
    console.log("\n🔐 Admin Login:");
    console.log("   Email: admin@mentourme.com");
    console.log("   Password: Admin123!");
    console.log("\n👨‍🏫 Mentor Login (John):");
    console.log("   Email: john.mentor@example.com");
    console.log("   Password: Mentor123!");
    console.log("\n👩‍🎓 User Login (Alice):");
    console.log("   Email: alice@example.com");
    console.log("   Password: User123!");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await sequelize.close();
    console.log("✅ Database connection closed");
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Seeding process failed:", error);
      process.exit(1);
    });
}


module.exports = { seedDatabase };

