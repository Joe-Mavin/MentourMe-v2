const { User, OnboardingData, Task, MentorshipRequest, CommunityRoom, Message } = require("../models");
const { Op } = require("sequelize");
const notificationService = require("../services/notificationService");
const emailService = require('../services/emailService');

const getPendingMentors = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const mentors = await User.findAndCountAll({
      where: {
        role: "mentor",
        approved: false,
        isActive: true
      },
      include: [{
        model: OnboardingData,
        as: "onboardingData",
        required: false
      }],
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        mentors: mentors.rows,
        pagination: {
          total: mentors.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(mentors.count / limit)
        }
      }
    });
  } catch (error) {
    console.error("Get pending mentors error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const approveMentor = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { approved, adminNotes } = req.body;

    const mentor = await User.findByPk(mentorId);
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found"
      });
    }

    if (mentor.role !== "mentor") {
      return res.status(400).json({
        success: false,
        message: "User is not a mentor"
      });
    }

    await mentor.update({ 
      approved: approved === true,
      // Store admin notes in a separate field if you want to track approval reasons
    });

    // Send notification to mentor about approval/rejection
    try {
      await notificationService.notifyMentorApproval(
        mentor.id, 
        approved === true, 
        adminNotes
      );
    } catch (notificationError) {
      console.error("Failed to send mentor approval notification:", notificationError);
      // Don't fail the main operation if notification fails
    }

    // Send email to mentor about approval/rejection
    try {
      const service = emailService.getInstance();
      if (approved === true) {
        await service.sendMentorApprovalEmail(mentor.email, mentor.name);
        console.log('✅ Mentor approval email sent to:', mentor.email);
      }
      // Note: For rejection, you could create a separate rejection email method
      // For now, we only send approval emails
    } catch (emailError) {
      console.error('❌ Failed to send mentor approval/rejection email:', emailError);
      // Don't fail the main operation if email fails
    }

    const action = approved ? "approved" : "rejected";
    
    res.json({
      success: true,
      message: `Mentor ${action} successfully`,
      data: { mentor: mentor.toJSON() }
    });
  } catch (error) {
    console.error("Approve mentor error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      approved, 
      isActive, 
      search 
    } = req.query;
    
    const offset = (page - 1) * limit;
    let whereClause = {};

    // Add filters
    if (role) whereClause.role = role;
    if (approved !== undefined) whereClause.approved = approved === "true";
    if (isActive !== undefined) whereClause.isActive = isActive === "true";
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      include: [{
        model: OnboardingData,
        as: "onboardingData",
        required: false
      }],
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          total: users.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(users.count / limit)
        }
      }
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, approved } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (approved !== undefined && user.role === "mentor") updateData.approved = approved;

    await user.update(updateData);

    res.json({
      success: true,
      message: "User status updated successfully",
      data: { user: user.toJSON() }
    });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    // Get user statistics
    const userStats = await User.findAll({
      attributes: [
        "role",
        [require("sequelize").fn("COUNT", "*"), "count"]
      ],
      group: ["role"]
    });

    // Get mentor approval statistics
    const mentorStats = await User.findAll({
      where: { role: "mentor" },
      attributes: [
        "approved",
        [require("sequelize").fn("COUNT", "*"), "count"]
      ],
      group: ["approved"]
    });

    // Get task statistics
    const taskStats = await Task.findAll({
      attributes: [
        "status",
        [require("sequelize").fn("COUNT", "*"), "count"]
      ],
      group: ["status"]
    });

    // Get message statistics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const messageStats = await Message.findOne({
      where: {
        createdAt: { [Op.gte]: thirtyDaysAgo }
      },
      attributes: [
        [require("sequelize").fn("COUNT", "*"), "total"]
      ]
    });

    // Get room statistics
    const roomStats = await CommunityRoom.findOne({
      attributes: [
        [require("sequelize").fn("COUNT", "*"), "total"]
      ]
    });

    // Format statistics
    const formattedUserStats = {
      user: 0,
      mentor: 0,
      admin: 0
    };

    userStats.forEach(stat => {
      formattedUserStats[stat.role] = parseInt(stat.dataValues.count);
    });

    const formattedMentorStats = {
      approved: 0,
      pending: 0
    };

    mentorStats.forEach(stat => {
      const key = stat.approved ? "approved" : "pending";
      formattedMentorStats[key] = parseInt(stat.dataValues.count);
    });

    const formattedTaskStats = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      verified: 0,
      rejected: 0
    };

    taskStats.forEach(stat => {
      formattedTaskStats[stat.status] = parseInt(stat.dataValues.count);
    });

    res.json({
      success: true,
      data: {
        users: formattedUserStats,
        mentors: formattedMentorStats,
        tasks: formattedTaskStats,
        messages: {
          last30Days: parseInt(messageStats?.dataValues?.total || 0)
        },
        rooms: {
          total: parseInt(roomStats?.dataValues?.total || 0)
        }
      }
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createCommunityRoom = async (req, res) => {
  try {
    const {
      name,
      description,
      category = "general",
      isPrivate = false,
      maxMembers = 100,
      rules
    } = req.body;

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
      message: "Community room created successfully",
      data: { room: completeRoom }
    });
  } catch (error) {
    console.error("Create community room error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getAllRooms = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, isPrivate } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { isActive: true };
    if (category) whereClause.category = category;
    if (isPrivate !== undefined) whereClause.isPrivate = isPrivate === "true";

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

    const roomsWithCounts = rooms.rows.map(room => ({
      ...room.toJSON(),
      memberCount: memberCountMap.get(room.id) || 0
    }));

    res.json({
      success: true,
      data: {
        rooms: roomsWithCounts,
        pagination: {
          total: rooms.count || 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil((rooms.count || 0) / limit)
        }
      }
    });
  } catch (error) {
    console.error("Get all rooms error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await CommunityRoom.findByPk(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    await room.update({ isActive: false });

    res.json({
      success: true,
      message: "Room deleted successfully"
    });
  } catch (error) {
    console.error("Delete room error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getPendingMentors,
  approveMentor,
  getAllUsers,
  updateUserStatus,
  getDashboardStats,
  createCommunityRoom,
  getAllRooms,
  deleteRoom
};

