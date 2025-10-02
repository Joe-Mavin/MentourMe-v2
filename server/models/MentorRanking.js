const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MentorRanking = sequelize.define('MentorRanking', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    mentorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Content & Knowledge Metrics
    totalBlogPosts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    avgContentQuality: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0
    },
    totalContentViews: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalContentLikes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalContentShares: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    // Mentorship Performance
    totalMentees: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    avgMenteeRating: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0
    },
    successfulMentorships: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    responseRate: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0
    },
    avgResponseTime: {
      type: DataTypes.INTEGER, // in minutes
      defaultValue: 0
    },
    
    // Community Engagement
    communityContributions: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    helpfulAnswers: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    peerEndorsements: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    // Overall Scores
    expertiseScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0
    },
    engagementScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0
    },
    impactScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0
    },
    overallScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0
    },
    
    // Ranking & Badges
    currentRank: {
      type: DataTypes.INTEGER,
      defaultValue: null
    },
    tier: {
      type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum', 'elite'),
      defaultValue: 'bronze'
    },
    badges: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    
    // Streak & Consistency
    contentStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastContentDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    consistencyScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0
    }
  }, {
    tableName: 'mentor_rankings',
    timestamps: true,
    indexes: [
      {
        fields: ['mentorId']
      },
      {
        fields: ['overallScore']
      },
      {
        fields: ['currentRank']
      },
      {
        fields: ['tier']
      }
    ]
  });

  return MentorRanking;
};
