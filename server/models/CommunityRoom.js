const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CommunityRoom = sequelize.define("CommunityRoom", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  name: { 
    type: DataTypes.STRING, 
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 100]
    }
  },
  description: { 
    type: DataTypes.TEXT 
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true, // ✅ allow NULL since we use ON DELETE SET NULL
    references: {
      model: "users", // Match the actual table name (lowercase)
      key: "id"
    },
    onDelete: "SET NULL",   // ✅ avoids the earlier error
    onUpdate: "CASCADE"
  },
  isPrivate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  maxMembers: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  category: {
    type: DataTypes.ENUM("mentorship", "goals", "accountability", "support", "skills", "networking", "wellness", "all"),
    defaultValue: "mentorship"
  },
  rules: {
    type: DataTypes.TEXT
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastActivity: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, { 
  timestamps: true 
});

module.exports = CommunityRoom;
