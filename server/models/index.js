const sequelize = require("../config/db");
const User = require("./User");
const OnboardingData = require("./OnboardingData");
const Message = require("./Message");
const CommunityRoom = require("./CommunityRoom");
const Task = require("./Task");
const RoomMembership = require("./RoomMembership");
const MentorshipRequest = require("./MentorshipRequest");
const Notification = require("./Notification");
const Newsletter = require("./Newsletter")(sequelize);
const BlogPost = require("./BlogPost")(sequelize);
const MentorRanking = require('./MentorRanking')(sequelize);
const BlogComment = require('./BlogComment')(sequelize);
const MentorshipSession = require('./MentorshipSession')(sequelize);

// User Relations
User.hasOne(OnboardingData, { 
  foreignKey: "userId", 
  as: "onboardingData",
  onDelete: "CASCADE" 
});
OnboardingData.belongsTo(User, { 
  foreignKey: "userId", 
  as: "user" 
});

// Message Relations
User.hasMany(Message, { 
  foreignKey: "senderId", 
  as: "sentMessages",
  onDelete: "CASCADE" 
});
Message.belongsTo(User, { 
  foreignKey: "senderId", 
  as: "sender" 
});

User.hasMany(Message, { 
  foreignKey: "receiverId", 
  as: "receivedMessages",
  onDelete: "CASCADE" 
});
Message.belongsTo(User, { 
  foreignKey: "receiverId", 
  as: "receiver" 
});

// Reply Relations
Message.hasMany(Message, { 
  foreignKey: "replyToId", 
  as: "replies",
  onDelete: "CASCADE" 
});
Message.belongsTo(Message, { 
  foreignKey: "replyToId", 
  as: "parentMessage" 
});

// Task Relations
User.hasMany(Task, { 
  foreignKey: "mentorId", 
  as: "assignedTasks",
  onDelete: "CASCADE" 
});
Task.belongsTo(User, { 
  foreignKey: "mentorId", 
  as: "mentor" 
});

User.hasMany(Task, { 
  foreignKey: "menteeId", 
  as: "receivedTasks",
  onDelete: "CASCADE" 
});
Task.belongsTo(User, { 
  foreignKey: "menteeId", 
  as: "mentee" 
});

// Community Room Relations
User.hasMany(CommunityRoom, { 
  foreignKey: "createdBy", 
  as: "createdRooms",
  onDelete: "SET NULL" 
});
CommunityRoom.belongsTo(User, { 
  foreignKey: "createdBy", 
  as: "creator" 
});

CommunityRoom.hasMany(Message, { 
  foreignKey: "roomId", 
  as: "messages",
  onDelete: "CASCADE" 
});
Message.belongsTo(CommunityRoom, { 
  foreignKey: "roomId", 
  as: "room" 
});

// Room Membership Relations
User.belongsToMany(CommunityRoom, { 
  through: RoomMembership, 
  foreignKey: "userId", 
  otherKey: "roomId",
  as: "joinedRooms" 
});
CommunityRoom.belongsToMany(User, { 
  through: RoomMembership, 
  foreignKey: "roomId", 
  otherKey: "userId",
  as: "members" 
});

User.hasMany(RoomMembership, { 
  foreignKey: "userId", 
  as: "roomMemberships",
  onDelete: "CASCADE" 
});
RoomMembership.belongsTo(User, { 
  foreignKey: "userId", 
  as: "user" 
});

CommunityRoom.hasMany(RoomMembership, { 
  foreignKey: "roomId", 
  as: "memberships",
  onDelete: "CASCADE" 
});
RoomMembership.belongsTo(CommunityRoom, { 
  foreignKey: "roomId", 
  as: "room" 
});

// Mentorship Request Relations
User.hasMany(MentorshipRequest, { 
  foreignKey: "mentorId", 
  as: "mentorshipRequests",
  onDelete: "CASCADE" 
});
MentorshipRequest.belongsTo(User, { 
  foreignKey: "mentorId", 
  as: "mentor" 
});

User.hasMany(MentorshipRequest, { 
  foreignKey: "menteeId", 
  as: "sentRequests",
  onDelete: "CASCADE" 
});
MentorshipRequest.belongsTo(User, { 
  foreignKey: "menteeId", 
  as: "mentee" 
});

// Notification Relations
User.hasMany(Notification, { 
  foreignKey: "userId", 
  as: "notifications",
  onDelete: "CASCADE" 
});
Notification.belongsTo(User, { 
  foreignKey: "userId", 
  as: "user" 
});

// Blog Post Relations
User.hasMany(BlogPost, { 
  foreignKey: "authorId", 
  as: "blogPosts",
  onDelete: "CASCADE" 
});
BlogPost.belongsTo(User, { 
  foreignKey: "authorId", 
  as: "author" 
});

// Mentor Ranking Relations
User.hasOne(MentorRanking, { 
  foreignKey: "mentorId", 
  as: "mentorRanking",
  onDelete: "CASCADE" 
});
MentorRanking.belongsTo(User, { 
  foreignKey: "mentorId", 
  as: "mentor" 
});

// Blog Comment Relations
BlogPost.hasMany(BlogComment, { 
  foreignKey: "postId", 
  as: "blogComments",
  onDelete: "CASCADE" 
});
BlogComment.belongsTo(BlogPost, { 
  foreignKey: "postId", 
  as: "blogPost" 
});

User.hasMany(BlogComment, { 
  foreignKey: "authorId", 
  as: "userComments",
  onDelete: "CASCADE" 
});
BlogComment.belongsTo(User, { 
  foreignKey: "authorId", 
  as: "commentAuthor" 
});

// Self-referencing for comment replies
BlogComment.hasMany(BlogComment, { 
  foreignKey: "parentId", 
  as: "commentReplies",
  onDelete: "CASCADE" 
});
BlogComment.belongsTo(BlogComment, { 
  foreignKey: "parentId", 
  as: "parentComment" 
});

// Mentorship Session Relations
MentorshipRequest.hasMany(MentorshipSession, { 
  foreignKey: "mentorshipId", 
  as: "sessions",
  onDelete: "CASCADE" 
});
MentorshipSession.belongsTo(MentorshipRequest, { 
  foreignKey: "mentorshipId", 
  as: "mentorship" 
});

User.hasMany(MentorshipSession, { 
  foreignKey: "mentorId", 
  as: "mentorSessions",
  onDelete: "CASCADE" 
});
MentorshipSession.belongsTo(User, { 
  foreignKey: "mentorId", 
  as: "mentor" 
});

User.hasMany(MentorshipSession, { 
  foreignKey: "menteeId", 
  as: "menteeSessions",
  onDelete: "CASCADE" 
});
MentorshipSession.belongsTo(User, { 
  foreignKey: "menteeId", 
  as: "mentee" 
});

module.exports = { 
  sequelize, 
  User, 
  OnboardingData, 
  Message, 
  CommunityRoom, 
  Task, 
  RoomMembership,
  MentorshipRequest,
  Notification,
  Newsletter,
  BlogPost,
  MentorRanking,
  BlogComment,
  MentorshipSession
};
