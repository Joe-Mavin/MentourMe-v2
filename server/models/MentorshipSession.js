const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MentorshipSession = sequelize.define('MentorshipSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  mentorshipId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  mentorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  menteeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER, // Duration in minutes
    allowNull: false,
    defaultValue: 60,
    validate: {
      min: 15,
      max: 240 // Max 4 hours
    }
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'),
    defaultValue: 'scheduled'
  },
  meetingLink: {
    type: DataTypes.STRING,
    allowNull: true
  },
  meetingType: {
    type: DataTypes.ENUM('video', 'audio', 'in_person'),
    defaultValue: 'video'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  mentorNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  menteeNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reminderSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'mentorship_sessions',
  timestamps: true
});

  return MentorshipSession;
};
