const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM(
        'mentor_approved',
        'mentor_rejected', 
        'task_assigned',
        'task_completed',
        'task_verified',
        'task_rejected',
        'new_message',
        'room_invitation',
        'room_joined',
        'room_member_added',
        'mentorship_assigned',
        'call_incoming',
        'call_accepted',
        'call_rejected',
        'call_ended',
        'call_missed',
        'session_scheduled',
        'session_confirmed',
        'session_cancelled',
        'session_completed',
        'session_reminder',
        'system_announcement',
        'profile_update_required'
      ),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional data related to the notification'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actionUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL to navigate when notification is clicked'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When this notification should be automatically removed'
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'isRead']
      },
      {
        fields: ['type']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

module.exports = Notification;
