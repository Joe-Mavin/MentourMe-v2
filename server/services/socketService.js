const jwt = require("jsonwebtoken");
const { User, Message, CommunityRoom, RoomMembership } = require("../models");

class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> Set of socket ids
    this.userSockets = new Map(); // socketId -> userId
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error("Authentication token required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId, {
          attributes: { exclude: ["password"] }
        });

        if (!user || !user.isActive) {
          return next(new Error("Invalid or inactive user"));
        }

        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (error) {
        next(new Error("Authentication failed"));
      }
    });

    this.io.on("connection", (socket) => {
      this.handleUserConnection(socket);
    });
  }

  handleUserConnection(socket) {
    const userId = socket.userId;
    
    // Track user connection
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId).add(socket.id);
    this.userSockets.set(socket.id, userId);

    console.log(`User ${userId} connected with socket ${socket.id}`);

    // Join user's personal room for direct messages
    socket.join(`user_${userId}`);

    // Join user's rooms
    this.joinUserRooms(socket, userId);

    // Set up event handlers
    this.setupMessageHandlers(socket);
    this.setupRoomHandlers(socket);
    this.setupVideoCallHandlers(socket);
    this.setupTypingHandlers(socket);

    // Handle disconnection
    socket.on("disconnect", () => {
      this.handleUserDisconnection(socket);
    });

    // Emit user online status
    this.broadcastUserStatus(userId, "online");
  }

  async joinUserRooms(socket, userId) {
    try {
      const memberships = await RoomMembership.findAll({
        where: { userId, isActive: true },
        include: [{
          model: CommunityRoom,
          as: "room",
          where: { isActive: true }
        }]
      });

      memberships.forEach(membership => {
        socket.join(`room_${membership.roomId}`);
      });
    } catch (error) {
      console.error("Error joining user rooms:", error);
    }
  }

  setupMessageHandlers(socket) {
    const userId = socket.userId;

    // Handle real-time message sending
    socket.on("send_message", async (data) => {
      try {
        const { receiverId, roomId, content, type = "text", replyToId, fileUrl, fileName, fileSize } = data;

        // Validate message target
        if (!receiverId && !roomId) {
          socket.emit("message_error", { error: "Either receiverId or roomId is required" });
          return;
        }

        // If sending to a room, check membership
        if (roomId) {
          const membership = await RoomMembership.findOne({
            where: { userId, roomId, isActive: true }
          });

          if (!membership) {
            socket.emit("message_error", { error: "You are not a member of this room" });
            return;
          }
        }

        // Create message in database
        const message = await Message.create({
          senderId: userId,
          receiverId,
          roomId,
          content,
          type,
          replyToId,
          fileUrl,
          fileName,
          fileSize
        });

        // Get complete message with sender info
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

        if (roomId) {
          // Send to all room members
          this.io.to(`room_${roomId}`).emit("new_room_message", completeMessage);
          
          // Update room's last activity
          await CommunityRoom.update(
            { lastActivity: new Date() },
            { where: { id: roomId } }
          );
        } else if (receiverId) {
          // Send to receiver
          this.io.to(`user_${receiverId}`).emit("new_direct_message", completeMessage);
          // Send back to sender for confirmation
          socket.emit("message_sent", completeMessage);
          
          // Auto-mark as delivered if receiver is online
          if (this.isUserOnline(receiverId)) {
            setTimeout(async () => {
              try {
                await Message.update(
                  { isDelivered: true, deliveredAt: new Date() },
                  { where: { id: completeMessage.id } }
                );
                
                // Notify sender of delivery
                this.io.to(`user_${userId}`).emit("message_delivered", {
                  messageId: completeMessage.id,
                  deliveredAt: new Date()
                });
              } catch (error) {
                console.error("Auto-delivery update failed:", error);
              }
            }, 100); // Small delay to ensure message is received
          }
        }

      } catch (error) {
        console.error("Send message error:", error);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    socket.on("send_direct_message", async (data) => {
      try {
        const { receiverId, content, type = "text" } = data;

        // Create message in database
        const message = await Message.create({
          senderId: userId,
          receiverId,
          content,
          type
        });

        // Get complete message with sender info
        const completeMessage = await Message.findByPk(message.id, {
          include: [{
            model: User,
            as: "sender",
            attributes: ["id", "name", "avatar", "role"]
          }]
        });

        // Send to receiver
        this.io.to(`user_${receiverId}`).emit("new_direct_message", completeMessage);
        
        // Send back to sender for confirmation
        socket.emit("message_sent", completeMessage);

      } catch (error) {
        console.error("Send direct message error:", error);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    socket.on("send_room_message", async (data) => {
      try {
        const { roomId, content, type = "text" } = data;

        // Verify user is member of the room
        const membership = await RoomMembership.findOne({
          where: { userId, roomId, isActive: true }
        });

        if (!membership) {
          socket.emit("message_error", { error: "Not a member of this room" });
          return;
        }

        // Create message in database
        const message = await Message.create({
          senderId: userId,
          roomId,
          content,
          type
        });

        // Get complete message with sender info
        const completeMessage = await Message.findByPk(message.id, {
          include: [{
            model: User,
            as: "sender",
            attributes: ["id", "name", "avatar", "role"]
          }]
        });

        // Send to all room members
        this.io.to(`room_${roomId}`).emit("new_room_message", completeMessage);

        // Update room's last activity
        await CommunityRoom.update(
          { lastActivity: new Date() },
          { where: { id: roomId } }
        );

      } catch (error) {
        console.error("Send room message error:", error);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    socket.on("mark_messages_read", async (data) => {
      try {
        const { otherUserId, roomId } = data;

        if (otherUserId) {
          // Mark direct messages as read
          await Message.update(
            { isRead: true, readAt: new Date() },
            {
              where: {
                senderId: otherUserId,
                receiverId: userId,
                isRead: false
              }
            }
          );

          // Notify other user that messages were read
          this.io.to(`user_${otherUserId}`).emit("messages_read", { readBy: userId });
        }

        if (roomId) {
          // Update last read timestamp for room
          await RoomMembership.update(
            { lastReadAt: new Date() },
            { where: { userId, roomId } }
          );
        }

      } catch (error) {
        console.error("Mark messages read error:", error);
      }
    });
  }

  setupRoomHandlers(socket) {
    const userId = socket.userId;

    socket.on("join_room", async (data) => {
      try {
        const { roomId } = data;

        // Verify membership
        const membership = await RoomMembership.findOne({
          where: { userId, roomId, isActive: true }
        });

        if (membership) {
          socket.join(`room_${roomId}`);
          socket.emit("room_joined", { roomId });
          
          // Notify other room members
          socket.to(`room_${roomId}`).emit("user_joined_room", {
            user: socket.user,
            roomId
          });
        } else {
          socket.emit("room_error", { error: "Not a member of this room" });
        }

      } catch (error) {
        console.error("Join room error:", error);
        socket.emit("room_error", { error: "Failed to join room" });
      }
    });

    socket.on("leave_room", (data) => {
      const { roomId } = data;
      socket.leave(`room_${roomId}`);
      socket.emit("room_left", { roomId });
      
      // Notify other room members
      socket.to(`room_${roomId}`).emit("user_left_room", {
        user: socket.user,
        roomId
      });
    });
  }

  setupVideoCallHandlers(socket) {
    const userId = socket.userId;

    // Room management for video calls
    socket.on("join_room", (data) => {
      const { roomId } = data;
      console.log(`User ${userId} joining room: ${roomId}`);
      socket.join(roomId);
      socket.emit("room_joined", { roomId, success: true });
    });

    socket.on("leave_room", (data) => {
      const { roomId } = data;
      console.log(`User ${userId} leaving room: ${roomId}`);
      socket.leave(roomId);
      socket.emit("room_left", { roomId, success: true });
    });

    // Handle participant leaving call
    socket.on("call_participant_left", (data) => {
      const { callId, participantId, participantName, reason, timestamp } = data;
      console.log(`📡 SERVER: RECEIVED call_participant_left event from user ${userId}`);
      console.log(`📡 SERVER: Event data:`, data);
      console.log(`📡 SERVER: User ${participantId} left call ${callId} - reason: ${reason}`);
      console.log(`📡 SERVER: Broadcasting to room ${callId}`);
      
      // Broadcast to all other participants in the call room
      const broadcastData = {
        callId,
        participantId,
        participantName: participantName || socket.user?.name || `User ${participantId}`,
        reason,
        timestamp: timestamp || new Date().toISOString()
      };
      
      console.log(`📡 SERVER: Broadcasting data:`, broadcastData);
      socket.to(callId).emit("call_participant_left", broadcastData);
      console.log(`📡 SERVER: Broadcast sent to room ${callId}`);
    });

    socket.on("initiate_call", (data) => {
      const { receiverId, callType = "video", roomId } = data;

      const callData = {
        callId: `call_${Date.now()}_${userId}`,
        callerId: userId,
        caller: socket.user,
        callType,
        roomId
      };

      if (receiverId) {
        // Direct call
        this.io.to(`user_${receiverId}`).emit("incoming_call", callData);
      } else if (roomId) {
        // Room call
        socket.to(`room_${roomId}`).emit("incoming_room_call", callData);
      }

      socket.emit("call_initiated", callData);
    });

    socket.on("answer_call", (data) => {
      const { callId, callerId, answer } = data;
      
      this.io.to(`user_${callerId}`).emit("call_answered", {
        callId,
        answeredBy: userId,
        answer
      });
    });

    socket.on("end_call", (data) => {
      const { callId, participants } = data;
      
      // Notify all participants (with validation)
      if (participants && Array.isArray(participants)) {
        participants.forEach(participantId => {
          if (participantId !== userId) {
            this.io.to(`user_${participantId}`).emit("call_ended", { callId });
          }
        });
      } else {
        console.warn('end_call event received without valid participants array:', data);
      }
    });

    // WebRTC signaling for peer-to-peer connections
    socket.on("offer", (data) => {
      const { targetId, offer, callId } = data;
      console.log(`📡 Relaying offer from ${userId} to ${targetId} for call ${callId}`);
      
      this.sendToUser(targetId, "offer", {
        fromId: userId,
        offer,
        callId
      });
    });

    socket.on("answer", (data) => {
      const { targetId, answer, callId } = data;
      console.log(`📡 Relaying answer from ${userId} to ${targetId} for call ${callId}`);
      
      this.sendToUser(targetId, "answer", {
        fromId: userId,
        answer,
        callId
      });
    });

    socket.on("ice-candidate", (data) => {
      const { targetId, candidate, callId } = data;
      console.log(`🧊 Relaying ICE candidate from ${userId} to ${targetId} for call ${callId}`);
      
      this.sendToUser(targetId, "ice-candidate", {
        fromId: userId,
        candidate,
        callId
      });
    });

    // Call participant management
    socket.on("participant-joined", (data) => {
      const { callId } = data;
      console.log(`👤 User ${userId} joined call ${callId}`);
      
      // Join the call room
      socket.join(callId);
      
      // Notify other participants
      socket.to(callId).emit("participant-joined", {
        participantId: userId,
        participantInfo: {
          id: userId,
          name: socket.user.name,
          avatar: socket.user.avatar
        }
      });
    });

    socket.on("participant-left", (data) => {
      const { callId } = data;
      console.log(`👋 User ${userId} left call ${callId}`);
      
      // Leave the call room
      socket.leave(callId);
      
      // Notify other participants
      socket.to(callId).emit("participant-left", {
        participantId: userId
      });
    });
  }

  setupTypingHandlers(socket) {
    const userId = socket.userId;

    socket.on("typing_start", (data) => {
      const { receiverId, roomId, conversationId } = data;

      if (receiverId) {
        this.io.to(`user_${receiverId}`).emit("user_typing", {
          userId,
          user: socket.user,
          conversationId: conversationId || `direct_${userId}_${receiverId}`
        });
      } else if (roomId) {
        socket.to(`room_${roomId}`).emit("user_typing", {
          userId,
          user: socket.user,
          roomId,
          conversationId: conversationId || `room_${roomId}`
        });
      }
    });

    socket.on("typing_stop", (data) => {
      const { receiverId, roomId, conversationId } = data;

      if (receiverId) {
        this.io.to(`user_${receiverId}`).emit("user_stopped_typing", {
          userId,
          conversationId: conversationId || `direct_${userId}_${receiverId}`
        });
      } else if (roomId) {
        socket.to(`room_${roomId}`).emit("user_stopped_typing", {
          userId,
          roomId,
          conversationId: conversationId || `room_${roomId}`
        });
      }
    });

    // Handle join/leave conversation for better real-time updates
    socket.on("join_conversation", (data) => {
      const { conversationId, type } = data;
      if (type === 'room') {
        socket.join(`room_${conversationId}`);
      }
      console.log(`User ${userId} joined conversation ${conversationId}`);
    });

    socket.on("leave_conversation", (data) => {
      const { conversationId, type } = data;
      if (type === 'room') {
        socket.leave(`room_${conversationId}`);
      }
      console.log(`User ${userId} left conversation ${conversationId}`);
    });
  }

  handleUserDisconnection(socket) {
    const userId = socket.userId;
    
    if (this.connectedUsers.has(userId)) {
      this.connectedUsers.get(userId).delete(socket.id);
      
      // If no more connections for this user, mark as offline
      if (this.connectedUsers.get(userId).size === 0) {
        this.connectedUsers.delete(userId);
        this.broadcastUserStatus(userId, "offline");
      }
    }
    
    this.userSockets.delete(socket.id);
    console.log(`User ${userId} disconnected socket ${socket.id}`);
  }

  broadcastUserStatus(userId, status) {
    console.log(`Broadcasting user status: ${userId} is ${status}`);
    this.io.emit("user_status_change", {
      userId,
      status,
      timestamp: new Date()
    });
    
    // Also emit specific online/offline events
    if (status === 'online') {
      this.io.emit("user_online", { userId, timestamp: new Date() });
    } else if (status === 'offline') {
      this.io.emit("user_offline", { userId, timestamp: new Date() });
    }
  }

  // Utility methods
  isUserOnline(userId) {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId).size > 0;
  }

  getOnlineUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  sendToUser(userId, event, data) {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  emitCallAccepted(userId, data) {
    this.io.to(`user_${userId}`).emit('call_accepted', data);
  }

  emitToRoom(roomId, event, data) {
    console.log(` Emitting ${event} to room ${roomId}:`, data);
    this.io.to(roomId).emit(event, data);
  }

  sendToRoom(roomId, event, data) {
    this.io.to(`room_${roomId}`).emit(event, data);
  }

  // Notification methods
  emitToUser(userId, event, data) {
    if (this.isUserOnline(userId)) {
      this.sendToUser(userId, event, data);
      return true;
    }
    return false;
  }

  emitNotification(userId, notification) {
    return this.emitToUser(userId, 'new_notification', notification);
  }

  // Video call methods
  emitIncomingCall(userId, callData) {
    return this.emitToUser(userId, 'incoming_call', callData);
  }

  emitCallAccepted(userId, callData) {
    return this.emitToUser(userId, 'call_accepted', callData);
  }

  emitCallRejected(userId, callData) {
    return this.emitToUser(userId, 'call_rejected', callData);
  }

  emitCallEnded(userId, callData) {
    return this.emitToUser(userId, 'call_ended', callData);
  }
}

module.exports = SocketService;

