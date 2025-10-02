const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const RoomMembership = sequelize.define("RoomMembership", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  userId: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  roomId: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  role: {
    type: DataTypes.ENUM("member", "moderator", "admin"),
    defaultValue: "member"
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  lastReadAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  isMuted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, { 
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["userId", "roomId"]
    }
  ]
});

module.exports = RoomMembership;

