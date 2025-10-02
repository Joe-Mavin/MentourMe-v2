const { User, MentorshipRequest } = require("../models");
const { Op } = require("sequelize");
const notificationService = require("../services/notificationService");

// Initiate a direct mentor-mentee video call
const initiateCall = async (req, res) => {
  try {
    const callerId = req.user.id;
    const { targetUserId, callType = 'video', purpose, sessionType } = req.body;

    // Validate target user exists
    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found"
      });
    }

    // Verify mentorship relationship exists
    const mentorship = await MentorshipRequest.findOne({
      where: {
        status: 'accepted',
        [Op.or]: [
          { mentorId: callerId, menteeId: targetUserId },
          { mentorId: targetUserId, menteeId: callerId }
        ]
      },
      include: [
        {
          model: User,
          as: "mentor",
          attributes: ["id", "name", "avatar"]
        },
        {
          model: User,
          as: "mentee", 
          attributes: ["id", "name", "avatar"]
        }
      ]
    });

    if (!mentorship) {
      return res.status(403).json({
        success: false,
        message: "You can only call users you have an active mentorship with"
      });
    }

    // Determine caller and receiver roles
    const isCallerMentor = mentorship.mentorId === callerId;
    const callerRole = isCallerMentor ? 'mentor' : 'mentee';
    const receiverRole = isCallerMentor ? 'mentee' : 'mentor';

    // Generate unique call ID
    const callId = `call_${Date.now()}_${callerId}_${targetUserId}`;

    // Create call context
    const callContext = {
      callId,
      callerId,
      targetUserId,
      callerRole,
      receiverRole,
      callType,
      purpose: purpose || 'general_session',
      sessionType: sessionType || 'mentorship',
      mentorshipId: mentorship.id,
      mentor: mentorship.mentor,
      mentee: mentorship.mentee,
      initiatedAt: new Date(),
      status: 'initiating'
    };

    // Send notification to target user about incoming call
    const callerName = req.user.name;
    const purposeText = getPurposeText(purpose);
    
    await notificationService.createNotification({
      userId: targetUserId,
      type: 'call_incoming',
      title: `Incoming ${callType} call from ${callerName} 📞`,
      message: `${callerName} (${callerRole}) is calling you for ${purposeText}`,
      priority: 'urgent',
      actionUrl: `/video-call/${callId}?accept=true`,
      data: {
        callId,
        callerId,
        callerName,
        callerRole,
        callType,
        purpose,
        sessionType
      },
      expiresAt: new Date(Date.now() + 60000) // Expires in 1 minute
    });

    // Send real-time call notification via Socket.IO
    const socketService = req.app.get('socketService');
    if (socketService) {
      socketService.emitIncomingCall(targetUserId, {
        callId,
        callerId,
        callerName,
        callerRole,
        callType,
        purpose: purposeText,
        sessionType,
        mentorshipId: mentorship.id
      });
    }

    res.status(200).json({
      success: true,
      message: "Call initiated successfully",
      data: { callContext }
    });

  } catch (error) {
    console.error("Initiate call error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initiate call",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Accept a video call
const acceptCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    console.log(`📞 Accept call request - CallId: ${callId}, UserId: ${userId}`);

    // Validate callId format
    if (!callId || !callId.startsWith('call_')) {
      return res.status(400).json({
        success: false,
        message: "Invalid call ID format"
      });
    }

    // Extract caller info from callId (this is a simplified approach)
    const callIdParts = callId.split('_');
    if (callIdParts.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Invalid call ID structure"
      });
    }
    
    const callerId = parseInt(callIdParts[2]);

    // Notify caller that call was accepted
    await notificationService.createNotification({
      userId: parseInt(callerId),
      type: 'call_accepted',
      title: 'Call Accepted',
      message: `${req.user.name} accepted your call`,
      priority: 'high',
      actionUrl: `/video-call/${callId}`,
      data: { callId, acceptedBy: userId, acceptedAt: new Date() }
    });

    // Send real-time notification via Socket.IO
    const socketService = req.app.get('socketService');
    if (socketService) {
      // Notify caller that call was accepted
      socketService.emitCallAccepted(parseInt(callerId), {
        callId,
        acceptedBy: userId,
        acceptedByName: req.user.name,
        redirectUrl: `/video-call/${callId}`
      });

      // Emit participant joined event to the call room
      socketService.emitToRoom(callId, 'call_participant_joined', {
        callId,
        participantId: userId,
        participantInfo: {
          id: userId,
          name: req.user.name,
          role: req.user.role || 'user',
          joinedAt: new Date().toISOString()
        }
      });
    }

    res.json({
      success: true,
      message: "Call accepted",
      data: { 
        callId,
        redirectUrl: `/video-call/${callId}`
      }
    });

  } catch (error) {
    console.error("Accept call error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept call",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Reject a video call
const rejectCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    // Extract caller info from callId
    const [, , callerId] = callId.split('_');

    // Notify caller that call was rejected
    await notificationService.createNotification({
      userId: parseInt(callerId),
      type: 'call_rejected',
      title: 'Call Declined',
      message: `${req.user.name} declined your call${reason ? `: ${reason}` : ''}`,
      priority: 'medium',
      data: { 
        callId, 
        rejectedBy: userId, 
        rejectedAt: new Date(),
        reason 
      }
    });

    res.json({
      success: true,
      message: "Call rejected"
    });

  } catch (error) {
    console.error("Reject call error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject call",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// End a video call and collect feedback
const endCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const { 
      duration, 
      feedback, 
      rating, 
      sessionNotes, 
      nextSteps,
      wasProductive 
    } = req.body;
    const userId = req.user.id;

    // Extract call participants from callId
    const [, , callerId, targetUserId] = callId.split('_');
    const otherParticipantId = userId === parseInt(callerId) ? parseInt(targetUserId) : parseInt(callerId);

    // Get mentorship relationship to determine roles
    const mentorship = await MentorshipRequest.findOne({
      where: {
        status: 'accepted',
        [Op.or]: [
          { mentorId: userId, menteeId: otherParticipantId },
          { mentorId: otherParticipantId, menteeId: userId }
        ]
      },
      include: [
        { model: User, as: "mentor", attributes: ["id", "name"] },
        { model: User, as: "mentee", attributes: ["id", "name"] }
      ]
    });

    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: "Mentorship relationship not found"
      });
    }

    const isMentor = mentorship.mentorId === userId;
    const userRole = isMentor ? 'mentor' : 'mentee';
    const otherRole = isMentor ? 'mentee' : 'mentor';

    // Store call feedback (you might want to create a CallSession model for this)
    const callSummary = {
      callId,
      duration,
      endedBy: userId,
      endedAt: new Date(),
      feedback,
      rating,
      sessionNotes,
      nextSteps,
      wasProductive,
      mentorshipId: mentorship.id
    };

    // Send call summary to the other participant
    const otherParticipantName = isMentor ? mentorship.mentee.name : mentorship.mentor.name;
    
    await notificationService.createNotification({
      userId: otherParticipantId,
      type: 'call_ended',
      title: `Call with ${req.user.name} ended`,
      message: `Session lasted ${formatDuration(duration)}${wasProductive ? ' - Marked as productive' : ''}`,
      priority: 'low',
      actionUrl: `/mentorship/sessions`,
      data: {
        callId,
        duration,
        endedBy: userId,
        endedByName: req.user.name,
        wasProductive,
        hasNotes: !!sessionNotes
      }
    });

    // If mentor provided next steps, notify mentee
    if (isMentor && nextSteps) {
      await notificationService.createNotification({
        userId: otherParticipantId,
        type: 'next_steps_assigned',
        title: 'Next Steps from Your Mentor 📝',
        message: `${req.user.name} has outlined next steps for you`,
        priority: 'high',
        actionUrl: `/mentorship/action-items`,
        data: {
          mentorId: userId,
          mentorName: req.user.name,
          nextSteps,
          sessionId: callId
        }
      });
    }

    res.json({
      success: true,
      message: "Call ended and feedback recorded",
      data: { callSummary }
    });

  } catch (error) {
    console.error("End call error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to end call",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Get call history for mentorship
const getCallHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mentorshipId, limit = 20, page = 1 } = req.query;

    // Verify user is part of the mentorship
    const mentorship = await MentorshipRequest.findOne({
      where: {
        id: mentorshipId,
        status: 'accepted',
        [Op.or]: [
          { mentorId: userId },
          { menteeId: userId }
        ]
      }
    });

    if (!mentorship) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this mentorship"
      });
    }

    // Here you would fetch call history from your call sessions storage
    // For now, returning a placeholder response
    const callHistory = {
      sessions: [],
      totalSessions: 0,
      totalDuration: 0,
      averageRating: 0,
      productiveSessions: 0
    };

    res.json({
      success: true,
      data: { callHistory }
    });

  } catch (error) {
    console.error("Get call history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get call history",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Helper functions
const getPurposeText = (purpose) => {
  const purposes = {
    'general_session': 'a general mentorship session',
    'goal_review': 'goal review and planning',
    'problem_solving': 'problem-solving discussion',
    'skill_development': 'skill development session',
    'career_guidance': 'career guidance',
    'project_review': 'project review',
    'check_in': 'a quick check-in',
    'emergency': 'urgent assistance'
  };
  return purposes[purpose] || 'a mentorship session';
};

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

module.exports = {
  initiateCall,
  acceptCall,
  rejectCall,
  endCall,
  getCallHistory
};
