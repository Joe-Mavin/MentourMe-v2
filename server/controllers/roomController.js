const { CommunityRoom, RoomMembership, User, Message } = require("../models");
const { Op } = require("sequelize");
const notificationService = require("../services/notificationService");

const getRooms = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    let whereClause = { 
      isActive: true,
      [Op.or]: [
        { isPrivate: false },
        { 
          id: {
            [Op.in]: require("sequelize").literal(`(
              SELECT roomId FROM RoomMemberships 
              WHERE userId = ${userId} AND isActive = true
            )`)
          }
        }
      ]
    };

    if (category) whereClause.category = category;
    if (search) {
      whereClause[Op.or].push(
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      );
    }

    const rooms = await CommunityRoom.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "avatar"]
        }
      ],
      order: [["lastActivity", "DESC"]],
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    // Get member counts separately to avoid GROUP BY issues
    const roomIds = rooms.rows.map(room => room.id);
    const memberCounts = await RoomMembership.findAll({
      where: { 
        roomId: { [Op.in]: roomIds },
        isActive: true 
      },
      attributes: [
        'roomId',
        [require("sequelize").fn("COUNT", "*"), "memberCount"]
      ],
      group: ['roomId'],
      raw: true
    });

    const memberCountMap = new Map();
    memberCounts.forEach(mc => {
      memberCountMap.set(mc.roomId, parseInt(mc.memberCount));
    });

    // Check user's membership status for each room
    const userMemberships = await RoomMembership.findAll({
      where: {
        userId,
        roomId: { [Op.in]: roomIds },
        isActive: true
      }
    });

    const membershipMap = new Map();
    userMemberships.forEach(membership => {
      membershipMap.set(membership.roomId, membership);
    });

    const roomsWithMembership = rooms.rows.map(room => {
      const membership = membershipMap.get(room.id);
      return {
        ...room.toJSON(),
        memberCount: memberCountMap.get(room.id) || 0,
        userMembership: membership || null,
        isMember: !!membership
      };
    });

    res.json({
      success: true,
      data: {
        rooms: roomsWithMembership,
        pagination: {
          total: rooms.count || 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil((rooms.count || 0) / limit)
        }
      }
    });
  } catch (error) {
    console.error("Get rooms error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createRoom = async (req, res) => {
  try {
    const {
      name,
      description,
      category = "mentorship",
      isPrivate = false,
      maxMembers = 100,
      rules
    } = req.body;

    // Check if room name already exists
    const existingRoom = await CommunityRoom.findOne({
      where: { name, isActive: true }
    });

    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: "Room with this name already exists"
      });
    }

    const room = await CommunityRoom.create({
      name,
      description,
      category,
      isPrivate,
      maxMembers,
      rules,
      createdBy: req.user.id
    });

    // Add creator as admin member
    await RoomMembership.create({
      userId: req.user.id,
      roomId: room.id,
      role: "admin"
    });

    const completeRoom = await CommunityRoom.findByPk(room.id, {
      include: [{
        model: User,
        as: "creator",
        attributes: ["id", "name", "avatar"]
      }]
    });

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: { room: completeRoom }
    });
  } catch (error) {
    console.error("Create room error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    console.log(`🏠 JOIN ROOM REQUEST: User ${userId} trying to join room ${roomId} - FIXED VERSION`);

    const room = await CommunityRoom.findByPk(roomId);
    if (!room || !room.isActive) {
      console.log(`❌ Room ${roomId} not found or inactive`);
      return res.status(404).json({
        success: false,
        message: "Room not found or inactive"
      });
    }

    console.log(`✅ Room ${roomId} found: ${room.name}`);

    // Check if already an active member
    const existingActiveMembership = await RoomMembership.findOne({
      where: { userId, roomId, isActive: true }
    });

    if (existingActiveMembership) {
      console.log(`⚠️ User ${userId} already an active member of room ${roomId}`);
      return res.status(400).json({
        success: false,
        message: "Already a member of this room"
      });
    }

    // Check if there's an inactive membership that can be reactivated
    const existingInactiveMembership = await RoomMembership.findOne({
      where: { userId, roomId, isActive: false }
    });

    if (existingInactiveMembership) {
      console.log(`🔄 Reactivating existing membership for user ${userId} in room ${roomId}`);
      await existingInactiveMembership.update({ 
        isActive: true,
        joinedAt: new Date()
      });
      
      console.log(`✅ MEMBERSHIP REACTIVATED:`, {
        id: existingInactiveMembership.id,
        userId: existingInactiveMembership.userId,
        roomId: existingInactiveMembership.roomId,
        role: existingInactiveMembership.role,
        isActive: existingInactiveMembership.isActive
      });

      return res.json({
        success: true,
        message: "Rejoined room successfully",
        data: { membership: existingInactiveMembership }
      });
    }

    // Check room capacity
    const currentMemberCount = await RoomMembership.count({
      where: { roomId, isActive: true }
    });

    if (currentMemberCount >= room.maxMembers) {
      return res.status(400).json({
        success: false,
        message: "Room is at full capacity"
      });
    }

    // For private rooms, you might want to add invitation logic here
    if (room.isPrivate) {
      return res.status(403).json({
        success: false,
        message: "This is a private room. Invitation required."
      });
    }

    console.log(`🔄 Creating membership for user ${userId} in room ${roomId}`);
    
    let membership;
    try {
      membership = await RoomMembership.create({
        userId,
        roomId,
        role: "member"
      });

      console.log(`✅ MEMBERSHIP CREATED:`, {
        id: membership.id,
        userId: membership.userId,
        roomId: membership.roomId,
        role: membership.role,
        isActive: membership.isActive
      });
    } catch (dbError) {
      // Handle duplicate entry error gracefully
      if (dbError.code === 'ER_DUP_ENTRY') {
        console.log(`⚠️ User ${userId} already a member of room ${roomId} (database level)`);
        
        // Find the existing membership
        membership = await RoomMembership.findOne({
          where: { userId, roomId, isActive: true }
        });
        
        if (membership) {
          console.log(`✅ Found existing membership:`, {
            id: membership.id,
            userId: membership.userId,
            roomId: membership.roomId,
            role: membership.role,
            isActive: membership.isActive
          });
        }
      } else {
        // Re-throw other database errors
        throw dbError;
      }
    }

    // Emit real-time event for room join
    const socketService = req.app.get('socketService');
    if (socketService) {
      // Notify all room members about the new member
      socketService.sendToRoom(roomId, 'user_joined_room', {
        user: {
          id: req.user.id,
          name: req.user.name,
          avatar: req.user.avatar,
          role: req.user.role
        },
        roomId,
        membership: {
          id: membership.id,
          role: membership.role,
          joinedAt: membership.joinedAt
        }
      });
    }

    res.json({
      success: true,
      message: "Joined room successfully",
      data: { membership }
    });
  } catch (error) {
    console.error("Join room error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const membership = await RoomMembership.findOne({
      where: { userId, roomId, isActive: true }
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "You are not a member of this room"
      });
    }

    await membership.update({ isActive: false });

    // Emit real-time event for room leave
    const socketService = req.app.get('socketService');
    if (socketService) {
      // Notify all room members about the user leaving
      socketService.sendToRoom(roomId, 'user_left_room', {
        user: {
          id: req.user.id,
          name: req.user.name,
          avatar: req.user.avatar,
          role: req.user.role
        },
        roomId,
        leftAt: new Date()
      });
    }

    res.json({
      success: true,
      message: "Left room successfully"
    });
  } catch (error) {
    console.error("Leave room error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getRoomMembers = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    // Check if user is a member of the room
    console.log(`🔍 CHECKING MEMBERSHIP: User ${userId} in room ${roomId}`);
    const userMembership = await RoomMembership.findOne({
      where: { userId, roomId, isActive: true }
    });

    console.log(`🔍 MEMBERSHIP RESULT:`, userMembership ? {
      id: userMembership.id,
      userId: userMembership.userId,
      roomId: userMembership.roomId,
      isActive: userMembership.isActive,
      role: userMembership.role
    } : 'NOT FOUND');

    if (!userMembership) {
      console.log(`❌ ACCESS DENIED: User ${userId} not a member of room ${roomId}`);
      return res.status(403).json({
        success: false,
        message: "You must be a member to view room members"
      });
    }

    const members = await RoomMembership.findAndCountAll({
      where: { roomId, isActive: true },
      include: [{
        model: User,
        as: "user",
        attributes: ["id", "name", "avatar", "role"]
      }],
      order: [["joinedAt", "ASC"]],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        members: members.rows,
        pagination: {
          total: members.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(members.count / limit)
        }
      }
    });
  } catch (error) {
    console.error("Get room members error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateRoomMember = async (req, res) => {
  try {
    const { roomId, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user.id;

    // Check if current user is admin/moderator of the room
    const userMembership = await RoomMembership.findOne({
      where: { 
        userId, 
        roomId, 
        isActive: true,
        role: { [Op.in]: ["admin", "moderator"] }
      }
    });

    if (!userMembership) {
      return res.status(403).json({
        success: false,
        message: "Only room admins/moderators can update member roles"
      });
    }

    const targetMembership = await RoomMembership.findOne({
      where: { userId: memberId, roomId, isActive: true }
    });

    if (!targetMembership) {
      return res.status(404).json({
        success: false,
        message: "Member not found in this room"
      });
    }

    await targetMembership.update({ role });

    const updatedMembership = await RoomMembership.findByPk(targetMembership.id, {
      include: [{
        model: User,
        as: "user",
        attributes: ["id", "name", "avatar", "role"]
      }]
    });

    res.json({
      success: true,
      message: "Member role updated successfully",
      data: { membership: updatedMembership }
    });
  } catch (error) {
    console.error("Update room member error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getJoinedRooms = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const memberships = await RoomMembership.findAndCountAll({
      where: { userId, isActive: true },
      include: [{
        model: CommunityRoom,
        as: "room",
        where: { isActive: true },
        include: [{
          model: User,
          as: "creator",
          attributes: ["id", "name", "avatar"]
        }]
      }],
      order: [["lastReadAt", "DESC"]],
      limit: parseInt(limit),
      offset
    });

    // Get unread message counts for each room
    const roomIds = memberships.rows.map(m => m.roomId);
    const unreadCounts = await Promise.all(
      roomIds.map(async (roomId) => {
        const membership = memberships.rows.find(m => m.roomId === roomId);
        const count = await Message.count({
          where: {
            roomId,
            createdAt: { [Op.gt]: membership.lastReadAt },
            senderId: { [Op.ne]: userId }
          }
        });
        return { roomId, unreadCount: count };
      })
    );

    const unreadMap = new Map();
    unreadCounts.forEach(({ roomId, unreadCount }) => {
      unreadMap.set(roomId, unreadCount);
    });

    const roomsWithUnread = memberships.rows.map(membership => ({
      ...membership.toJSON(),
      unreadCount: unreadMap.get(membership.roomId) || 0
    }));

    res.json({
      success: true,
      data: {
        rooms: roomsWithUnread,
        pagination: {
          total: memberships.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(memberships.count / limit)
        }
      }
    });
  } catch (error) {
    console.error("Get joined rooms error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const addRoomMember = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId, role = 'member' } = req.body;
    const requesterId = req.user.id;

    // Check if room exists
    const room = await CommunityRoom.findByPk(roomId);
    if (!room || !room.isActive) {
      return res.status(404).json({
        success: false,
        message: "Room not found or inactive"
      });
    }

    // Check if requester has permission (admin, mentor, or room creator)
    const requesterMembership = await RoomMembership.findOne({
      where: { userId: requesterId, roomId, isActive: true }
    });

    const isRoomCreator = room.createdBy === requesterId;
    const hasPermission = req.user.role === 'admin' || 
                         req.user.role === 'mentor' || 
                         isRoomCreator ||
                         (requesterMembership && ['admin', 'moderator'].includes(requesterMembership.role));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to add members to this room"
      });
    }

    // Check if user is already a member
    const existingMembership = await RoomMembership.findOne({
      where: { userId, roomId, isActive: true }
    });

    if (existingMembership) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this room"
      });
    }

    // Check room capacity
    const currentMemberCount = await RoomMembership.count({
      where: { roomId, isActive: true }
    });

    if (currentMemberCount >= room.maxMembers) {
      return res.status(400).json({
        success: false,
        message: "Room is at full capacity"
      });
    }

    // Add the member
    const membership = await RoomMembership.create({
      userId,
      roomId,
      role,
      joinedAt: new Date(),
      isActive: true
    });

    // Get user details for response
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'role']
    });

    // Get the user who added the member (requester)
    const addedByUser = await User.findByPk(requesterId, {
      attributes: ['id', 'name', 'email', 'role']
    });

    // Send notification to the added user
    try {
      console.log(`📧 Sending notification to user ${userId} about being added to room ${roomId}`);
      await notificationService.notifyUserAddedToRoom(userId, room, addedByUser);
      console.log(`✅ Notification sent successfully`);
    } catch (notificationError) {
      console.error('Failed to send room addition notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      message: "Member added successfully",
      data: {
        membership: {
          id: membership.id,
          userId: membership.userId,
          roomId: membership.roomId,
          role: membership.role,
          joinedAt: membership.joinedAt,
          user
        }
      }
    });
  } catch (error) {
    console.error("Add room member error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getRooms,
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomMembers,
  updateRoomMember,
  getJoinedRooms,
  addRoomMember,
};
