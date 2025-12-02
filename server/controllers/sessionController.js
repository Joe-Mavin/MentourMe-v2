const sessionRepo = require('../repositories/sessionRepository');
const mentorshipRepo = require('../repositories/mentorshipRepository');
const userRepo = require('../repositories/userRepository');
const notificationService = require('../services/notificationService');

async function enrichSession(session) {
  if (!session) return null;
  const [mentor, mentee] = await Promise.all([
    userRepo.findById(session.mentorId),
    userRepo.findById(session.menteeId)
  ]);
  return {
    ...session,
    mentor: mentor ? userRepo.sanitize(mentor) : null,
    mentee: mentee ? userRepo.sanitize(mentee) : null,
  };
}

// Schedule a new session
const scheduleSession = async (req, res) => {
  try {
    const { mentorshipId, title, description, scheduledAt, duration = 60, meetingType = 'video' } = req.body;
    const userId = req.user.id;

    console.log('📅 Creating session (FS):', { mentorshipId, title, scheduledAt, userId });

    // Find the mentorship to know mentor/mentee IDs
    const mentorship = await mentorshipRepo.findById(mentorshipId);
    if (!mentorship) {
      return res.status(404).json({ success: false, message: 'Mentorship not found' });
    }

    const session = await sessionRepo.create({
      mentorshipId: parseInt(mentorshipId),
      mentorId: mentorship.mentorId,
      menteeId: mentorship.menteeId,
      title,
      description,
      scheduledAt,
      duration: parseInt(duration),
      meetingType,
      status: 'scheduled'
    });

    const isSchedulerMentor = userId === mentorship.mentorId;
    const recipientId = isSchedulerMentor ? mentorship.menteeId : mentorship.mentorId;
    const schedulerRole = isSchedulerMentor ? 'mentor' : 'mentee';

    // Notify other party
    await notificationService.createNotification({
      userId: recipientId,
      type: 'session_scheduled',
      title: 'New Session Scheduled',
      message: `Your ${schedulerRole} has scheduled a new session: "${title}" on ${new Date(scheduledAt).toLocaleDateString()}`,
      priority: 'high',
      actionUrl: '/mentorship/sessions',
      data: { sessionId: session.id, mentorshipId, scheduledAt }
    });

    // Emit session update to both participants
    const socketService = req.app.get('socketService');
    if (socketService) {
      const enriched = await enrichSession(session);
      socketService.emitToUser(mentorship.mentorId, 'session_update', { type: 'session_created', session: enriched });
      socketService.emitToUser(mentorship.menteeId, 'session_update', { type: 'session_created', session: enriched });
    }

    res.status(201).json({ success: true, message: 'Session scheduled successfully', data: { session } });
  } catch (error) {
    console.error('Schedule session error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get user's sessions
const getUserSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, upcoming = false, page = 1, limit = 10 } = req.query;

    const { rows, count } = await sessionRepo.findAndCountByUser({
      userId,
      status,
      upcoming,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    const enriched = await Promise.all(rows.map(enrichSession));

    res.json({
      success: true,
      data: {
        sessions: enriched,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalSessions: count
        }
      }
    });
  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get session details
const getSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const session = await sessionRepo.findByIdForUser(id, userId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    const [enriched, mentorship] = await Promise.all([
      enrichSession(session),
      mentorshipRepo.findById(session.mentorshipId)
    ]);
    res.json({ success: true, data: { session: { ...enriched, mentorship: mentorship ? { id: mentorship.id, status: mentorship.status } : null } } });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update session
const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    const session = await sessionRepo.findByIdForUser(id, userId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const allowedUpdates = {};
    if (session.status === 'scheduled') {
      if (updates.title) allowedUpdates.title = updates.title;
      if (updates.description) allowedUpdates.description = updates.description;
      if (updates.scheduledAt) allowedUpdates.scheduledAt = new Date(updates.scheduledAt).toISOString();
      if (updates.duration) allowedUpdates.duration = updates.duration;
      if (updates.meetingType) allowedUpdates.meetingType = updates.meetingType;
    }
    if (updates.status && ['confirmed', 'cancelled'].includes(updates.status)) {
      allowedUpdates.status = updates.status;
      if (updates.status === 'cancelled') {
        allowedUpdates.cancelledAt = new Date().toISOString();
        if (updates.cancellationReason) allowedUpdates.cancellationReason = updates.cancellationReason;
      }
    }
    if (updates.notes) {
      if (session.mentorId === userId) allowedUpdates.mentorNotes = updates.notes;
      else allowedUpdates.menteeNotes = updates.notes;
    }

    const updated = await sessionRepo.updateByIdForUser(id, userId, allowedUpdates);
    const enriched = await enrichSession(updated);
    res.json({ success: true, message: 'Session updated successfully', data: { session: enriched } });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Complete session with feedback
const completeSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback, notes } = req.body;
    const userId = req.user.id;

    const session = await sessionRepo.findByIdForUser(id, userId);
    if (!session || !['confirmed', 'in_progress', 'scheduled'].includes(session.status)) {
      return res.status(404).json({ success: false, message: 'Session not found or cannot be completed' });
    }

    const updates = { status: 'completed', completedAt: new Date().toISOString() };
    if (rating) updates.rating = rating;
    if (feedback) updates.feedback = feedback;
    if (notes) {
      if (session.mentorId === userId) updates.mentorNotes = notes;
      else updates.menteeNotes = notes;
    }

    await sessionRepo.updateByIdForUser(id, userId, updates);
    res.json({ success: true, message: 'Session completed successfully' });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get session statistics
const getSessionStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await sessionRepo.aggregateStatsByUser(userId);
    res.json({ success: true, data: { stats } });
  } catch (error) {
    console.error('Get session stats error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
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
