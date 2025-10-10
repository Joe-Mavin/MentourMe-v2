const { MentorshipSession, MentorshipRequest, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Schedule a new session
const scheduleSession = async (req, res) => {
  try {
    const { 
      mentorshipId, 
      title, 
      description, 
      scheduledAt, 
      duration = 60,
      meetingType = 'video'
    } = req.body;
    const userId = req.user.id;

    console.log('📅 Creating session:', { 
      mentorshipId, 
      title, 
      scheduledAt, 
      userId,
      requestBody: req.body 
    });

    // Get the mentorship to find proper mentor/mentee IDs
    const mentorship = await MentorshipRequest.findByPk(mentorshipId);
    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship not found'
      });
    }

    console.log('📋 Mentorship details:', {
      mentorshipId: mentorship.id,
      mentorId: mentorship.mentorId,
      menteeId: mentorship.menteeId,
      schedulingUserId: userId,
      isSchedulerMentor: userId === mentorship.mentorId
    });

    // Create session with proper mentor/mentee assignment
    const session = await MentorshipSession.create({
      mentorshipId: parseInt(mentorshipId),
      mentorId: mentorship.mentorId,
      menteeId: mentorship.menteeId,
      title,
      description,
      scheduledAt: new Date(scheduledAt),
      duration: parseInt(duration),
      meetingType,
      status: 'scheduled'
    });

    // Create notifications for both mentor and mentee
    const { createNotification } = require('./notificationController');
    
    // Determine who is scheduling (mentor or mentee) and notify the other party
    const isSchedulerMentor = userId === mentorship.mentorId;
    const recipientId = isSchedulerMentor ? mentorship.menteeId : mentorship.mentorId;
    const schedulerRole = isSchedulerMentor ? 'mentor' : 'mentee';
    const recipientRole = isSchedulerMentor ? 'mentee' : 'mentor';

    // Create notification for the other party
    await createNotification({
      userId: recipientId,
      type: 'session_scheduled',
      title: 'New Session Scheduled',
      message: `Your ${schedulerRole} has scheduled a new session: "${title}" on ${new Date(scheduledAt).toLocaleDateString()}`,
      relatedId: session.id,
      relatedType: 'session'
    });

    // Send real-time notification via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${recipientId}`).emit('notification', {
        type: 'session_scheduled',
        title: 'New Session Scheduled',
        message: `Your ${schedulerRole} has scheduled a new session: "${title}"`,
        session: session,
        timestamp: new Date()
      });

      // Also emit session update
      io.to(`user_${mentorship.mentorId}`).emit('session_update', {
        type: 'session_created',
        session: session
      });
      
      io.to(`user_${mentorship.menteeId}`).emit('session_update', {
        type: 'session_created', 
        session: session
      });
    }

    console.log('✅ Session created with notifications:', {
      sessionId: session.id,
      mentorId: mentorship.mentorId,
      menteeId: mentorship.menteeId,
      notifiedUser: recipientId
    });

    res.status(201).json({
      success: true,
      message: 'Session scheduled successfully',
      data: { session }
    });

  } catch (error) {
    console.error('Schedule session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user's sessions
const getUserSessions = async (req, res) => {
  try {
    console.log('🎯 GET USER SESSIONS: Request received', {
      userId: req.user?.id,
      query: req.query,
      url: req.url
    });
    
    const userId = req.user.id;
    const { status, upcoming = false, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {
      [Op.or]: [
        { mentorId: userId },
        { menteeId: userId }
      ]
    };

    if (status) {
      // Handle comma-separated status values
      if (status.includes(',')) {
        whereClause.status = { [Op.in]: status.split(',') };
      } else {
        whereClause.status = status;
      }
    }

    if (upcoming === 'true') {
      whereClause.scheduledAt = { [Op.gte]: new Date() };
    }

    // Query with mentor and mentee information
    const { count, rows: sessions } = await MentorshipSession.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'mentor',
          attributes: ['id', 'name', 'avatar', 'email'],
          required: true
        },
        {
          model: User,
          as: 'mentee', 
          attributes: ['id', 'name', 'avatar', 'email'],
          required: true
        }
      ],
      order: [['scheduledAt', upcoming === 'true' ? 'ASC' : 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalSessions: count
        }
      }
    });

  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get session details
const getSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const session = await MentorshipSession.findOne({
      where: {
        id,
        [Op.or]: [
          { mentorId: userId },
          { menteeId: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'mentor',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'mentee',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: MentorshipRequest,
          as: 'mentorship',
          attributes: ['id', 'status']
        }
      ]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: { session }
    });

  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update session
const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    const session = await MentorshipSession.findOne({
      where: {
        id,
        [Op.or]: [
          { mentorId: userId },
          { menteeId: userId }
        ]
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Only allow certain fields to be updated based on user role and session status
    const allowedUpdates = {};
    
    if (session.status === 'scheduled') {
      if (updates.title) allowedUpdates.title = updates.title;
      if (updates.description) allowedUpdates.description = updates.description;
      if (updates.scheduledAt) allowedUpdates.scheduledAt = new Date(updates.scheduledAt);
      if (updates.duration) allowedUpdates.duration = updates.duration;
      if (updates.meetingType) allowedUpdates.meetingType = updates.meetingType;
    }

    if (updates.status && ['confirmed', 'cancelled'].includes(updates.status)) {
      allowedUpdates.status = updates.status;
      if (updates.status === 'cancelled') {
        allowedUpdates.cancelledAt = new Date();
        if (updates.cancellationReason) {
          allowedUpdates.cancellationReason = updates.cancellationReason;
        }
      }
    }

    if (updates.notes) {
      if (session.mentorId === userId) {
        allowedUpdates.mentorNotes = updates.notes;
      } else {
        allowedUpdates.menteeNotes = updates.notes;
      }
    }

    await session.update(allowedUpdates);

    // Fetch updated session with details
    const updatedSession = await MentorshipSession.findByPk(session.id, {
      include: [
        {
          model: User,
          as: 'mentor',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'mentee',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Session updated successfully',
      data: { session: updatedSession }
    });

  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Complete session with feedback
const completeSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback, notes } = req.body;
    const userId = req.user.id;

    const session = await MentorshipSession.findOne({
      where: {
        id,
        [Op.or]: [
          { mentorId: userId },
          { menteeId: userId }
        ],
        status: ['confirmed', 'in_progress']
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or cannot be completed'
      });
    }

    const updates = {
      status: 'completed',
      completedAt: new Date()
    };

    if (rating) updates.rating = rating;
    if (feedback) updates.feedback = feedback;
    
    if (notes) {
      if (session.mentorId === userId) {
        updates.mentorNotes = notes;
      } else {
        updates.menteeNotes = notes;
      }
    }

    await session.update(updates);

    res.json({
      success: true,
      message: 'Session completed successfully'
    });

  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get session statistics
const getSessionStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await MentorshipSession.findAll({
      where: {
        [Op.or]: [
          { mentorId: userId },
          { menteeId: userId }
        ]
      },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const formattedStats = {
      total: 0,
      scheduled: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0
    };

    stats.forEach(stat => {
      formattedStats[stat.status] = parseInt(stat.count);
      formattedStats.total += parseInt(stat.count);
    });

    res.json({
      success: true,
      data: { stats: formattedStats }
    });

  } catch (error) {
    console.error('Get session stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  scheduleSession,
  getUserSessions,
  getSession,
  updateSession,
  completeSession,
  getSessionStats
};
