const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const MentorshipRequest = sequelize.define("MentorshipRequest", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  mentorId: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  menteeId: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  status: {
    type: DataTypes.ENUM("pending", "accepted", "rejected", "cancelled"),
    defaultValue: "pending"
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  mentorNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  requestedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  respondedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  matchScore: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10
    }
  }
}, { 
  timestamps: true,
  tableName: 'mentorshiprequests',
  indexes: [
    {
      unique: true,
      fields: ['mentorId', 'menteeId', 'status'],
      where: {
        status: 'pending'
      }
    }
  ]
});

module.exports = MentorshipRequest;
