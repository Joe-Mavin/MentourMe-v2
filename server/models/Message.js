const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Message = sequelize.define("Message", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  senderId: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  receiverId: { 
    type: DataTypes.INTEGER,
    allowNull: true // nullable for group chats
  },
  roomId: { 
    type: DataTypes.INTEGER,
    allowNull: true
  },
  content: { 
    type: DataTypes.TEXT, 
    allowNull: false 
  },
  type: { 
    type: DataTypes.ENUM("text", "file", "video", "image", "audio"), 
    defaultValue: "text" 
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isRead: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: false 
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  replyToId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, { 
  timestamps: true,
  indexes: [
    {
      fields: ["senderId", "receiverId"]
    },
    {
      fields: ["roomId"]
    },
    {
      fields: ["createdAt"]
    }
  ]
});

module.exports = Message;

