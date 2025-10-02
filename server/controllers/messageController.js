const { Message, User, CommunityRoom, RoomMembership } = require("../models");
const { Op } = require("sequelize");

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { content, type = "text", receiverId, roomId, replyToId, fileUrl, fileName, fileSize } = req.body;

    // Validate message target
    if (!receiverId && !roomId) {
      return res.status(400).json({
        success: false,
        message: "Either receiverId or roomId is required"
      });
    }

    if (receiverId && roomId) {
      return res.status(400).json({
        success: false,
        message: "Cannot send to both user and room simultaneously"
      });
    }

    // If sending to a room, check membership
    if (roomId) {
      const membership = await RoomMembership.findOne({
        where: { userId: senderId, roomId, isActive: true }
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this room"
        });
      }
    }

    // If sending to a user, validate receiver exists
    if (receiverId) {
      const receiver = await User.findByPk(receiverId);
      if (!receiver || !receiver.isActive) {
        return res.status(404).json({
          success: false,
          message: "Receiver not found or inactive"
        });
      }
    }

    // Create message
    const message = await Message.create({
      senderId,
      receiverId,
      roomId,
      content,
      type,
      replyToId,
      fileUrl,
      fileName,
      fileSize
    });

    // Fetch complete message with sender info
    const completeMessage = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name", "avatar", "role"]
        },
        {
          model: Message,
          as: "parentMessage",
          required: false,
          include: [{
            model: User,
            as: "sender",
            attributes: ["id", "name"]
          }]
        }
      ]
    });

    // Update room's last activity if it's a room message
    if (roomId) {
      await CommunityRoom.update(
        { lastActivity: new Date() },
        { where: { id: roomId } }
      );
    }

    // Emit real-time message events
    const socketService = req.app.get('socketService');
    if (socketService) {
      if (roomId) {
        // Emit to all room members
        socketService.sendToRoom(roomId, 'new_room_message', completeMessage);
      } else if (receiverId) {
        // Emit to direct message recipient
        socketService.sendToUser(receiverId, 'new_direct_message', completeMessage);
        // Also emit to sender for confirmation across multiple devices
        socketService.sendToUser(senderId, 'message_sent', completeMessage);
      }
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: { message: completeMessage }
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getDirectMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;

    // Verify other user exists
    const otherUser = await User.findByPk(otherUserId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const messages = await Message.findAndCountAll({
      where: {
        [Op.or]: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ],
        isDeleted: false
      },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name", "avatar", "role"]
        },
        {
          model: Message,
          as: "parentMessage",
          required: false,
          include: [{
            model: User,
            as: "sender",
            attributes: ["id", "name"]
          }]
        }
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset
    });

    // Mark messages as read and emit read receipts
    const updatedMessages = await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          senderId: otherUserId,
          receiverId: userId,
          isRead: false
        },
        returning: true
      }
    );

    // Emit read receipts to sender
    const socketService = req.app.get('socketService');
    if (socketService && updatedMessages[0] > 0) {
      socketService.sendToUser(otherUserId, 'messages_read', {
        readBy: userId,
        messageIds: updatedMessages[1]?.map(msg => msg.id) || [],
        readAt: new Date()
      });
    }

    res.json({
      success: true,
      data: {
        messages: messages.rows.reverse(), // Reverse to show oldest first
        pagination: {
          total: messages.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(messages.count / limit)
        }
      }
    });
  } catch (error) {
    console.error("Get direct messages error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getRoomMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;

    // Check if user is member of the room
    console.log(`🔍 CHECKING ROOM MESSAGE ACCESS: User ${userId} in room ${roomId}`);
    const membership = await RoomMembership.findOne({
      where: { userId, roomId, isActive: true }
    });

    console.log(`🔍 MESSAGE ACCESS RESULT:`, membership ? {
      id: membership.id,
      userId: membership.userId,
      roomId: membership.roomId,
      isActive: membership.isActive,
      role: membership.role
    } : 'NOT FOUND');

    if (!membership) {
      console.log(`❌ MESSAGE ACCESS DENIED: User ${userId} not a member of room ${roomId}`);
      return res.status(403).json({
        success: false,
        message: "You are not a member of this room"
      });
    }

    console.log(`🔍 QUERYING MESSAGES: Looking for messages in room ${roomId}`);
    const messages = await Message.findAndCountAll({
      where: {
        roomId,
        isDeleted: false
      },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name", "avatar", "role"]
        },
        {
          model: Message,
          as: "parentMessage",
          required: false,
          include: [{
            model: User,
            as: "sender",
            attributes: ["id", "name"]
          }]
        }
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset
    });

    console.log(`✅ FOUND ${messages.count} messages in room ${roomId}`);
    if (messages.count > 0) {
      console.log(`📝 Sample messages:`, messages.rows.slice(0, 2).map(m => ({
        id: m.id,
        content: m.content?.substring(0, 50) + '...',
        senderId: m.senderId,
        roomId: m.roomId
      })));
    } else {
      console.log(`📝 No messages found in room ${roomId}`);
    }

    // Update user's last read timestamp for this room
    await RoomMembership.update(
      { lastReadAt: new Date() },
      { where: { userId, roomId } }
    );

    res.json({
      success: true,
      data: {
        messages: messages.rows.reverse(), // Reverse to show oldest first
        pagination: {
          total: messages.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(messages.count / limit)
        }
      }
    });
  } catch (error) {
    console.error("Get room messages error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 GET CONVERSATIONS: User', userId, 'requesting conversations');

    // Get direct message conversations
    const directMessages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ],
        roomId: null,
        isDeleted: false
      },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name", "avatar", "role"]
        },
        {
          model: User,
          as: "receiver",
          attributes: ["id", "name", "avatar", "role"]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    // Group by conversation partner and get latest message
    const conversationMap = new Map();
    
    directMessages.forEach(message => {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      const partner = message.senderId === userId ? message.receiver : message.sender;
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partner,
          lastMessage: message,
          unreadCount: 0
        });
      }
      
      // Count unread messages
      if (message.receiverId === userId && !message.isRead) {
        conversationMap.get(partnerId).unreadCount++;
      }
    });

    const conversations = Array.from(conversationMap.values());

    res.json({
      success: true,
      data: { conversations }
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findByPk(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    // Only sender can delete their own messages
    if (message.senderId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages"
      });
    }

    await message.update({ 
      isDeleted: true,
      content: "This message was deleted"
    });

    res.json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const message = await Message.findByPk(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    // Only sender can edit their own messages
    if (message.senderId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own messages"
      });
    }

    // Only text messages can be edited
    if (message.type !== "text") {
      return res.status(400).json({
        success: false,
        message: "Only text messages can be edited"
      });
    }

    await message.update({ 
      content,
      editedAt: new Date()
    });

    const updatedMessage = await Message.findByPk(messageId, {
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name", "avatar", "role"]
        }
      ]
    });

    res.json({
      success: true,
      message: "Message updated successfully",
      data: { message: updatedMessage }
    });
  } catch (error) {
    console.error("Edit message error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const markMessagesAsDelivered = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({
        success: false,
        message: "messageIds array is required"
      });
    }

    // Update messages as delivered
    const updatedMessages = await Message.update(
      { isDelivered: true, deliveredAt: new Date() },
      {
        where: {
          id: messageIds,
          receiverId: userId,
          isDelivered: false
        },
        returning: true
      }
    );

    // Emit delivery receipts to senders
    const socketService = req.app.get('socketService');
    if (socketService && updatedMessages[0] > 0) {
      // Group messages by sender to send delivery receipts
      const messagesBySender = {};
      updatedMessages[1]?.forEach(msg => {
        if (!messagesBySender[msg.senderId]) {
          messagesBySender[msg.senderId] = [];
        }
        messagesBySender[msg.senderId].push(msg.id);
      });

      // Send delivery receipts to each sender
      Object.entries(messagesBySender).forEach(([senderId, msgIds]) => {
        socketService.sendToUser(parseInt(senderId), 'messages_delivered', {
          deliveredTo: userId,
          messageIds: msgIds,
          deliveredAt: new Date()
        });
      });
    }

    res.json({
      success: true,
      message: "Messages marked as delivered",
      data: { updatedCount: updatedMessages[0] }
    });
  } catch (error) {
    console.error("Mark messages as delivered error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  sendMessage,
  getDirectMessages,
  getRoomMessages,
  getConversations,
  deleteMessage,
  editMessage,
  markMessagesAsDelivered
};

