const { User, MentorshipRequest, OnboardingData } = require("../models");
const { Op } = require("sequelize");
const notificationService = require("../services/notificationService");
const emailService = require('../services/emailService');

// Create a mentorship request
const createRequest = async (req, res) => {
  try {
    const menteeId = req.user.id;
    const { mentorId, message, matchScore } = req.body;

    // Validate that the current user is a mentee
    if (req.user.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "Only users can send mentorship requests"
      });
    }

    // Validate mentor exists and is approved
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

    if (!mentor.approved) {
      return res.status(400).json({
        success: false,
        message: "Mentor is not approved yet"
      });
    }

    // Check if there's already a pending request between these users
    const existingRequest = await MentorshipRequest.findOne({
      where: {
        mentorId,
        menteeId,
        status: "pending"
      }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending request with this mentor"
      });
    }

    // Check if there's already an accepted request between these users
    const acceptedRequest = await MentorshipRequest.findOne({
      where: {
        mentorId,
        menteeId,
        status: "accepted"
      }
    });

    if (acceptedRequest) {
      return res.status(400).json({
        success: false,
        message: "You already have an active mentorship with this mentor"
      });
    }

    // Set expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create the mentorship request
    const mentorshipRequest = await MentorshipRequest.create({
      mentorId,
      menteeId,
      message: message || null,
      matchScore: matchScore || null,
      expiresAt
    });

    // Fetch the complete request with user data
    const completeRequest = await MentorshipRequest.findByPk(mentorshipRequest.id, {
      include: [
        {
          model: User,
          as: "mentor",
          attributes: ["id", "name", "email", "avatar"]
        },
        {
          model: User,
          as: "mentee",
          attributes: ["id", "name", "email", "avatar"]
        }
      ]
    });

    // Send notification to mentor about new mentorship request
    try {
      await notificationService.notifyMentorshipRequest(
        mentorId,
        req.user,
        completeRequest
      );
    } catch (notificationError) {
      console.error("Failed to send mentorship request notification:", notificationError);
      // Don't fail the main operation if notification fails
    }

    // Send email to mentor about new mentorship request
    try {
      const service = emailService.getInstance();
      await service.sendMentorshipRequestEmail(
        mentor.email,
        mentor.name,
        req.user.name,
        message || ''
      );
      console.log('✅ Mentorship request email sent to mentor:', mentor.email);
    } catch (emailError) {
      console.error('❌ Failed to send mentorship request email:', emailError);
      // Don't fail the main operation if email fails
    }

    res.status(201).json({
      success: true,
      message: "Mentorship request sent successfully",
      data: {
        requestId: completeRequest.id,
        request: completeRequest
      }
    });

  } catch (error) {
    console.error("Create mentorship request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send mentorship request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Get mentorship requests for the current user
const getRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = "all", status = "all", page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
    // Filter by request type (sent/received)
    if (type === "sent") {
      whereClause.menteeId = userId;
    } else if (type === "received") {
      whereClause.mentorId = userId;
    } else {
      whereClause[Op.or] = [
        { menteeId: userId },
        { mentorId: userId }
      ];
    }

    // Filter by status
    if (status !== "all") {
      whereClause.status = status;
    }

    const requests = await MentorshipRequest.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "mentor",
          attributes: ["id", "name", "email", "avatar"],
          include: [{
            model: OnboardingData,
            as: "onboardingData",
            attributes: ["experience", "interests", "preferredCommunicationStyle"]
          }]
        },
        {
          model: User,
          as: "mentee",
          attributes: ["id", "name", "email", "avatar"],
          include: [{
            model: OnboardingData,
            as: "onboardingData",
            attributes: ["goals", "struggles", "preferredCommunicationStyle"]
          }]
        }
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        requests: requests.rows,
        pagination: {
          total: requests.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(requests.count / limit)
        }
      }
    });

  } catch (error) {
    console.error("Get mentorship requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get mentorship requests",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Respond to a mentorship request (accept/reject)
const respondToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, mentorNotes } = req.body; // action: "accept" or "reject"
    const userId = req.user.id;

    // Validate action
    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either 'accept' or 'reject'"
      });
    }

    // Find the request
    const request = await MentorshipRequest.findByPk(requestId, {
      include: [
        {
          model: User,
          as: "mentor",
          attributes: ["id", "name", "email"]
        },
        {
          model: User,
          as: "mentee",
          attributes: ["id", "name", "email"]
        }
      ]
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Mentorship request not found"
      });
    }

    // Check if the current user is either the mentor or mentee for this request
    const isMentor = request.mentorId === userId;
    const isMentee = request.menteeId === userId;
    
    if (!isMentor && !isMentee) {
      return res.status(403).json({
        success: false,
        message: "You can only respond to your own mentorship requests"
      });
    }

    // Only mentors can accept/reject requests sent to them
    if (!isMentor && action === "accept") {
      return res.status(403).json({
        success: false,
        message: "Only mentors can accept mentorship requests"
      });
    }

    // Check if the request is still pending
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request has already been ${request.status}`
      });
    }

    // Check if the request has expired
    if (request.expiresAt && new Date() > request.expiresAt) {
      await request.update({ status: "expired" });
      return res.status(400).json({
        success: false,
        message: "This request has expired"
      });
    }

    // Update the request
    const updateData = {
      status: action === "accept" ? "accepted" : "rejected",
      respondedAt: new Date(),
      mentorNotes: mentorNotes || null
    };

    await request.update(updateData);

    // If accepted, we might want to create additional records or send notifications
    // This could be expanded to include creating a mentorship relationship record

    const updatedRequest = await MentorshipRequest.findByPk(requestId, {
      include: [
        {
          model: User,
          as: "mentor",
          attributes: ["id", "name", "email", "avatar"]
        },
        {
          model: User,
          as: "mentee",
          attributes: ["id", "name", "email", "avatar"]
        }
      ]
    });

    // Send notification to mentee about mentor's response
    try {
      await notificationService.notifyMentorshipResponse(
        request.menteeId,
        updatedRequest.mentor,
        action === "accept",
        mentorNotes
      );
    } catch (notificationError) {
      console.error("Failed to send mentorship response notification:", notificationError);
      // Don't fail the main operation if notification fails
    }

    // Send email to mentee about mentor's response
    if (action === "accept") {
      try {
        const service = emailService.getInstance();
        await service.sendMentorshipAcceptedEmail(
          request.mentee.email,
          request.mentee.name,
          request.mentor.name
        );
        console.log('✅ Mentorship accepted email sent to mentee:', request.mentee.email);
      } catch (emailError) {
        console.error('❌ Failed to send mentorship accepted email:', emailError);
        // Don't fail the main operation if email fails
      }
    }

    res.json({
      success: true,
      message: `Mentorship request ${action}ed successfully`,
      data: { request: updatedRequest }
    });

  } catch (error) {
    console.error("Respond to mentorship request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to respond to mentorship request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Cancel a mentorship request (by mentee)
const cancelRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const request = await MentorshipRequest.findByPk(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Mentorship request not found"
      });
    }

    // Check if the current user is the mentee for this request
    if (request.menteeId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own requests"
      });
    }

    // Check if the request is still pending
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a request that has been ${request.status}`
      });
    }

    await request.update({ 
      status: "cancelled",
      respondedAt: new Date()
    });

    res.json({
      success: true,
      message: "Mentorship request cancelled successfully"
    });

  } catch (error) {
    console.error("Cancel mentorship request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel mentorship request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Get mentorship statistics
const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = {
      sent: {
        total: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
        cancelled: 0
      },
      received: {
        total: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
        expired: 0
      }
    };

    // Get sent requests stats (if user is a mentee)
    if (req.user.role === "user") {
      const sentStats = await MentorshipRequest.findAll({
        where: { menteeId: userId },
        attributes: [
          "status",
          [require("sequelize").fn("COUNT", "*"), "count"]
        ],
        group: ["status"],
        raw: true
      });

      sentStats.forEach(stat => {
        stats.sent[stat.status] = parseInt(stat.count);
        stats.sent.total += parseInt(stat.count);
      });
    }

    // Get received requests stats (if user is a mentor)
    if (req.user.role === "mentor") {
      const receivedStats = await MentorshipRequest.findAll({
        where: { mentorId: userId },
        attributes: [
          "status",
          [require("sequelize").fn("COUNT", "*"), "count"]
        ],
        group: ["status"],
        raw: true
      });

      receivedStats.forEach(stat => {
        stats.received[stat.status] = parseInt(stat.count);
        stats.received.total += parseInt(stat.count);
      });
    }

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error("Get mentorship stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get mentorship statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Admin function to assign mentee to mentor directly
const adminAssignMentee = async (req, res) => {
  try {
    const { mentorId, menteeId, adminNotes } = req.body;

    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can assign mentees to mentors"
      });
    }

    // Validate mentor exists and is approved
    const mentor = await User.findByPk(mentorId);
    if (!mentor || mentor.role !== "mentor" || !mentor.approved) {
      return res.status(400).json({
        success: false,
        message: "Invalid or unapproved mentor"
      });
    }

    // Validate mentee exists
    const mentee = await User.findByPk(menteeId);
    if (!mentee || mentee.role !== "user") {
      return res.status(400).json({
        success: false,
        message: "Invalid mentee"
      });
    }

    // Check if there's already an active mentorship
    const existingMentorship = await MentorshipRequest.findOne({
      where: {
        mentorId,
        menteeId,
        status: "accepted"
      }
    });

    if (existingMentorship) {
      return res.status(400).json({
        success: false,
        message: "Mentorship already exists between these users"
      });
    }

    // Create direct assignment (bypass request process)
    const assignment = await MentorshipRequest.create({
      mentorId,
      menteeId,
      status: "accepted",
      message: "Admin assignment",
      mentorNotes: adminNotes || "Assigned by admin",
      respondedAt: new Date(),
      requestedAt: new Date()
    });

    const completeAssignment = await MentorshipRequest.findByPk(assignment.id, {
      include: [
        {
          model: User,
          as: "mentor",
          attributes: ["id", "name", "email", "avatar"]
        },
        {
          model: User,
          as: "mentee",
          attributes: ["id", "name", "email", "avatar"]
        }
      ]
    });

    // Send notifications to both parties
    try {
      await notificationService.createNotification({
        userId: mentorId,
        type: 'task_assigned',
        title: 'New Mentee Assigned! 👥',
        message: `Admin has assigned ${mentee.name} as your mentee`,
        priority: 'high',
        actionUrl: `/mentorship/dashboard`,
        data: { menteeId, menteeName: mentee.name, assignedBy: 'admin' }
      });

      await notificationService.createNotification({
        userId: menteeId,
        type: 'task_assigned',
        title: 'Mentor Assigned! 🎯',
        message: `Admin has assigned ${mentor.name} as your mentor`,
        priority: 'high',
        actionUrl: `/mentorship/dashboard`,
        data: { mentorId, mentorName: mentor.name, assignedBy: 'admin' }
      });
    } catch (notificationError) {
      console.error("Failed to send assignment notifications:", notificationError);
    }

    res.status(201).json({
      success: true,
      message: "Mentee assigned to mentor successfully",
      data: { assignment: completeAssignment }
    });

  } catch (error) {
    console.error("Admin assign mentee error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign mentee to mentor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get active mentorships (for mentor/mentee dashboard)
const getActiveMentorships = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role } = req.user;
    
    console.log(`🔍 GET ACTIVE MENTORSHIPS: User ${userId} (${role}) requesting active mentorships`);

    let whereClause = { status: 'accepted' };
    
    if (role === 'mentor') {
      whereClause.mentorId = userId;
    } else if (role === 'mentee') {
      whereClause.menteeId = userId;
    } else {
      // Get both mentor and mentee relationships
      whereClause[Op.or] = [
        { mentorId: userId },
        { menteeId: userId }
      ];
    }

    const mentorships = await MentorshipRequest.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "mentor",
          attributes: ["id", "name", "email", "avatar"]
        },
        {
          model: User,
          as: "mentee",
          attributes: ["id", "name", "email", "avatar"]
        }
      ],
      order: [["respondedAt", "DESC"]]
    });

    res.json({
      success: true,
      data: { mentorships }
    });

  } catch (error) {
    console.error("Get active mentorships error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get active mentorships",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Get unassigned mentees (for admin)
const getUnassignedMentees = async (req, res) => {
  try {
    console.log(`👥 ADMIN REQUEST: Getting unassigned mentees for admin user ${req.user.id}`);
    
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can view unassigned mentees"
      });
    }

    // Get all users with role 'user' who don't have an accepted mentorship
    console.log(`🔍 STEP 1: Finding assigned mentees...`);
    const assignedMenteeIds = await MentorshipRequest.findAll({
      where: { status: 'accepted' },
      attributes: ['menteeId'],
      raw: true
    }).then(results => results.map(r => r.menteeId));
    
    console.log(`✅ STEP 1: Found ${assignedMenteeIds.length} assigned mentees:`, assignedMenteeIds);

    console.log(`🔍 STEP 2: Finding unassigned mentees...`);
    
    // First, let's try without onboarding data to see if the basic query works
    const unassignedMentees = await User.findAll({
      where: {
        role: 'user',
        id: {
          [Op.notIn]: assignedMenteeIds.length > 0 ? assignedMenteeIds : [0] // Avoid empty array
        }
      },
      attributes: ["id", "name", "email", "avatar", "createdAt"],
      order: [["createdAt", "DESC"]]
    });
    
    console.log(`✅ STEP 2A: Found ${unassignedMentees.length} unassigned mentees (without onboarding data)`);
    
    // Now try to get onboarding data separately to avoid JOIN issues
    for (let mentee of unassignedMentees) {
      try {
        const onboardingData = await OnboardingData.findOne({
          where: { userId: mentee.id }
        });
        
        if (onboardingData) {
          // Convert JSON fields to strings for display if they're arrays
          const processedData = {
            id: onboardingData.id,
            goals: Array.isArray(onboardingData.goals) ? onboardingData.goals.join(', ') : onboardingData.goals,
            struggles: Array.isArray(onboardingData.struggles) ? onboardingData.struggles.join(', ') : onboardingData.struggles,
            preferredCommunicationStyle: onboardingData.preferredCommunicationStyle,
            experience: onboardingData.experience
          };
          mentee.dataValues.onboardingData = processedData;
        } else {
          mentee.dataValues.onboardingData = null;
        }
      } catch (error) {
        console.log(`⚠️  Could not fetch onboarding data for user ${mentee.id}:`, error.message);
        mentee.dataValues.onboardingData = null;
      }
    }

    console.log(`✅ STEP 2: Found ${unassignedMentees.length} unassigned mentees`);
    
    res.json({
      success: true,
      data: { unassignedMentees }
    });

  } catch (error) {
    console.error("Get unassigned mentees error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unassigned mentees",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

module.exports = {
  createRequest,
  getRequests,
  respondToRequest,
  cancelRequest,
  getStats,
  adminAssignMentee,
  getActiveMentorships,
  getUnassignedMentees
};
