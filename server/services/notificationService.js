const { Notification } = require("../models");

class NotificationService {
  constructor() {
    this.socketService = null;
  }

  setSocketService(socketService) {
    this.socketService = socketService;
  }

  // Create a notification
  async createNotification(notificationData) {
    try {
      const notification = await Notification.create(notificationData);
      
      // Send real-time notification via socket
      if (this.socketService && this.socketService.emitToUser) {
        this.socketService.emitToUser(notificationData.userId, 'new_notification', notification);
      }
      
      return notification;
    } catch (error) {
      console.error("Create notification error:", error);
      throw error;
    }
  }

  // Bulk create notifications
  async createBulkNotifications(notificationsData) {
    try {
      const notifications = await Notification.bulkCreate(notificationsData);
      
      // Send real-time notifications via socket
      if (this.socketService && this.socketService.emitToUser) {
        notificationsData.forEach((data, index) => {
          this.socketService.emitToUser(data.userId, 'new_notification', notifications[index]);
        });
      }
      
      return notifications;
    } catch (error) {
      console.error("Bulk create notifications error:", error);
      throw error;
    }
  }

  // Mentor approval notifications
  async notifyMentorApproval(mentorId, approved, adminNotes = null) {
    const title = approved ? "Mentor Application Approved! 🎉" : "Mentor Application Update";
    const message = approved 
      ? "Congratulations! Your mentor application has been approved. You can now start mentoring and creating tasks."
      : "Your mentor application has been reviewed. Please check your profile for more details.";
    
    return await this.createNotification({
      userId: mentorId,
      type: approved ? 'mentor_approved' : 'mentor_rejected',
      title,
      message,
      priority: approved ? 'high' : 'medium',
      actionUrl: '/profile',
      data: adminNotes ? { adminNotes } : null
    });
  }

  // Task notifications
  async notifyTaskAssigned(menteeId, task, mentor) {
    return await this.createNotification({
      userId: menteeId,
      type: 'task_assigned',
      title: "New Task Assigned 📋",
      message: `${mentor.name} assigned you a new task: "${task.title}"`,
      priority: task.priority || 'medium',
      actionUrl: `/tasks/${task.id}`,
      data: { 
        taskId: task.id, 
        taskTitle: task.title,
        mentorName: mentor.name,
        dueDate: task.dueDate
      }
    });
  }

  async notifyTaskCompleted(mentorId, task, mentee) {
    return await this.createNotification({
      userId: mentorId,
      type: 'task_completed',
      title: "Task Completed ✅",
      message: `${mentee.name} completed the task: "${task.title}"`,
      priority: 'medium',
      actionUrl: `/tasks/${task.id}`,
      data: { 
        taskId: task.id, 
        taskTitle: task.title,
        menteeName: mentee.name,
        completedAt: task.completedAt
      }
    });
  }

  async notifyTaskVerified(menteeId, task, verified, verificationNotes = null) {
    const title = verified ? "Task Verified! 🌟" : "Task Needs Revision";
    const message = verified 
      ? `Great job! Your task "${task.title}" has been verified.`
      : `Your task "${task.title}" needs some revisions. Check the feedback.`;
    
    return await this.createNotification({
      userId: menteeId,
      type: verified ? 'task_verified' : 'task_rejected',
      title,
      message,
      priority: 'medium',
      actionUrl: `/tasks/${task.id}`,
      data: { 
        taskId: task.id, 
        taskTitle: task.title,
        verificationNotes,
        verifiedAt: verified ? new Date() : null
      }
    });
  }

  // Mentorship request notifications
  async notifyMentorshipRequest(mentorId, mentee, request) {
    return await this.createNotification({
      userId: mentorId,
      type: 'mentorship_request',
      title: "New Mentorship Request 🤝",
      message: `${mentee.name} wants you as their mentor. "${request.message || 'No message provided'}"`,
      priority: 'high',
      actionUrl: `/mentorship/requests`,
      data: { 
        requestId: request.id, 
        menteeId: mentee.id,
        menteeName: mentee.name,
        requestMessage: request.message 
      }
    });
  }

  async notifyMentorshipResponse(menteeId, mentor, accepted, mentorNotes = null) {
    const title = accepted ? "Mentorship Request Accepted! 🎉" : "Mentorship Request Declined";
    const message = accepted 
      ? `Great news! ${mentor.name} has accepted your mentorship request and is now your mentor.`
      : `${mentor.name} has declined your mentorship request. ${mentorNotes ? `Note: "${mentorNotes}"` : ''}`;
    
    return await this.createNotification({
      userId: menteeId,
      type: accepted ? 'mentorship_accepted' : 'mentorship_rejected',
      title,
      message,
      priority: accepted ? 'high' : 'medium',
      actionUrl: accepted ? '/mentorship/dashboard' : '/mentorship/find-mentor',
      data: {
        mentorId: mentor.id,
        mentorName: mentor.name,
        accepted,
        mentorNotes
      }
    });
  }

  // Room notifications
  async notifyRoomInvitation(userId, room, inviterName) {
    return await this.createNotification({
      userId,
      type: 'room_invitation',
      title: "Room Invitation 🏠",
      message: `${inviterName} invited you to join "${room.name}"`,
      priority: 'medium',
      actionUrl: `/community/room/${room.id}`,
      data: { 
        roomId: room.id, 
        roomName: room.name,
        inviterName,
        category: room.category
      }
    });
  }

  async notifyNewRoomMember(roomMemberIds, newMember, room) {
    const notificationsData = roomMemberIds
      .filter(memberId => memberId !== newMember.id) // Don't notify the new member about themselves
      .map(memberId => ({
        userId: memberId,
        type: 'room_joined',
        title: "New Room Member 👋",
        message: `${newMember.name} joined "${room.name}"`,
        priority: 'low',
        actionUrl: `/community/room/${room.id}`,
        data: { 
          roomId: room.id, 
          roomName: room.name, 
          newMemberName: newMember.name,
          newMemberId: newMember.id
        }
      }));
    
    if (notificationsData.length > 0) {
      return await this.createBulkNotifications(notificationsData);
    }
    return [];
  }

  async notifyUserAddedToRoom(userId, room, addedByUser) {
    return await this.createNotification({
      userId,
      type: 'room_member_added',
      title: "Added to Room 🎉",
      message: `${addedByUser.name} added you to "${room.name}"`,
      priority: 'medium',
      actionUrl: `/community/room/${room.id}`,
      data: { 
        roomId: room.id, 
        roomName: room.name,
        addedByUserId: addedByUser.id,
        addedByUserName: addedByUser.name,
        category: room.category
      }
    });
  }

  // Message notifications (for important messages)
  async notifyNewMessage(recipientId, sender, message, isRoom = false) {
    const title = isRoom 
      ? `New message in ${message.roomName || 'room'}` 
      : `New message from ${sender.name}`;
    
    const content = message.content.length > 50 
      ? message.content.substring(0, 50) + '...' 
      : message.content;

    return await this.createNotification({
      userId: recipientId,
      type: 'new_message',
      title,
      message: content,
      priority: 'low',
      actionUrl: isRoom 
        ? `/community/room/${message.roomId}` 
        : `/messages/direct/${sender.id}`,
      data: {
        messageId: message.id,
        senderId: sender.id,
        senderName: sender.name,
        isRoom,
        roomId: message.roomId || null
      }
    });
  }

  // Call notifications
  async notifyIncomingCall(recipientId, caller, callData) {
    return await this.createNotification({
      userId: recipientId,
      type: 'call_incoming',
      title: `Incoming ${callData.callType} call 📞`,
      message: `${caller.name} is calling you`,
      priority: 'urgent',
      actionUrl: `/call/${callData.callId}`,
      data: {
        callId: callData.callId,
        callerId: caller.id,
        callerName: caller.name,
        callType: callData.callType
      },
      expiresAt: new Date(Date.now() + 2 * 60 * 1000) // Expire in 2 minutes
    });
  }

  async notifyMissedCall(recipientId, caller, callData) {
    return await this.createNotification({
      userId: recipientId,
      type: 'call_missed',
      title: "Missed Call 📞",
      message: `You missed a ${callData.callType} call from ${caller.name}`,
      priority: 'medium',
      actionUrl: `/messages/direct/${caller.id}`,
      data: {
        callId: callData.callId,
        callerId: caller.id,
        callerName: caller.name,
        callType: callData.callType,
        missedAt: new Date()
      }
    });
  }

  // System notifications
  async notifySystemAnnouncement(userIds, title, message, actionUrl = null, priority = 'medium') {
    const notificationsData = userIds.map(userId => ({
      userId,
      type: 'system_announcement',
      title,
      message,
      priority,
      actionUrl
    }));
    
    return await this.createBulkNotifications(notificationsData);
  }

  async notifyProfileUpdateRequired(userId, reason) {
    return await this.createNotification({
      userId,
      type: 'profile_update_required',
      title: "Profile Update Required ⚠️",
      message: `Please update your profile: ${reason}`,
      priority: 'high',
      actionUrl: '/profile',
      data: { reason }
    });
  }

  // Cleanup expired notifications
  async cleanupExpiredNotifications() {
    try {
      const result = await Notification.destroy({
        where: {
          expiresAt: {
            [require("sequelize").Op.lt]: new Date()
          }
        }
      });
      
      console.log(`Cleaned up ${result} expired notifications`);
      return result;
    } catch (error) {
      console.error("Cleanup expired notifications error:", error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
