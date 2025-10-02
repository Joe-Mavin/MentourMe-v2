const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Task = sequelize.define("Task", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
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
      notEmpty: true,
      len: [3, 200]
    }
  },
  description: { 
    type: DataTypes.TEXT, 
    allowNull: false 
  },
  status: { 
    type: DataTypes.ENUM("pending", "in_progress", "completed", "verified", "rejected"), 
    defaultValue: "pending" 
  },
  priority: {
    type: DataTypes.ENUM("low", "medium", "high", "urgent"),
    defaultValue: "medium"
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  verificationNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estimatedHours: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  actualHours: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, { 
  timestamps: true,
  indexes: [
    {
      fields: ["mentorId", "menteeId"]
    },
    {
      fields: ["status"]
    },
    {
      fields: ["dueDate"]
    }
  ]
});

module.exports = Task;

