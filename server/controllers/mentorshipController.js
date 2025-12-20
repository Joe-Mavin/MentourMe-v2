const userRepo = require("../repositories/userRepository");
const onboardingRepo = require("../repositories/onboardingRepository");
const mentorshipRepo = require("../repositories/mentorshipRepository");
const { getFirestore } = require("../config/firestore");
const notificationService = require("../services/notificationService");
const emailService = require('../services/emailService');

async function attachUsersAndOnboarding(reqObj) {
  if (!reqObj) return null;
  const [mentor, mentee, mentorOnb, menteeOnb] = await Promise.all([
    userRepo.findById(reqObj.mentorId),
    userRepo.findById(reqObj.menteeId),
    onboardingRepo.findByUserId(reqObj.mentorId),
    onboardingRepo.findByUserId(reqObj.menteeId),
  ]);
  return {
    ...reqObj,
    mentor: mentor ? userRepo.sanitize(mentor) : null,
    mentee: mentee ? userRepo.sanitize(mentee) : null,
    mentorOnboarding: mentorOnb || null,
    menteeOnboarding: menteeOnb || null,
  };
}

// Create a mentorship request (Firestore)
const createRequest = async (req, res) => {
  try {
    const menteeId = req.user.id;
    const { mentorId, message, matchScore } = req.body;

    if (req.user.role !== "user") {
      return res.status(403).json({ success: false, message: "Only users can send mentorship requests" });
    }

    const mentor = await userRepo.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ success: false, message: "Mentor not found" });
    }
    if (mentor.role !== "mentor") {
      return res.status(400).json({ success: false, message: "User is not a mentor" });
    }
    if (!mentor.approved) {
      return res.status(400).json({ success: false, message: "Mentor is not approved yet" });
    }

    const existingPending = await mentorshipRepo.findPendingBetweenUsers(mentorId, menteeId);
    if (existingPending) {
      return res.status(400).json({ success: false, message: "You already have a pending request with this mentor" });
    }

    const acceptedRequest = await mentorshipRepo.findAcceptedBetweenUsers(mentorId, menteeId);
    if (acceptedRequest) {
      return res.status(400).json({ success: false, message: "You already have an active mentorship with this mentor" });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const created = await mentorshipRepo.create({
      mentorId,
      menteeId,
      message: message || null,
      matchScore: matchScore || null,
      expiresAt
    });

    const completeRequest = await attachUsersAndOnboarding(created);

    try {
      await notificationService.notifyMentorshipRequest(mentorId, userRepo.sanitize(req.user), completeRequest);
    } catch (notificationError) {
      console.error("Failed to send mentorship request notification:", notificationError);
    }

    try {
      const service = emailService.getInstance();
      await service.sendMentorshipRequestEmail(mentor.email, mentor.name, req.user.name, message || '');
      console.log('✅ Mentorship request email sent to mentor:', mentor.email);
    } catch (emailError) {
      console.error('❌ Failed to send mentorship request email:', emailError);
    }

    res.status(201).json({ success: true, message: "Mentorship request sent successfully", data: { requestId: created.id, request: completeRequest } });
  } catch (error) {
    console.error("Create mentorship request error:", error);
    res.status(500).json({ success: false, message: "Failed to send mentorship request", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

// Get mentorship requests for the current user (Firestore)
const getRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = "all", status = "all", page = 1, limit = 20 } = req.query;
    const db = getFirestore();
    const col = db.collection('mentorship_requests');

    let docs = [];
    if (type === 'sent') {
      const q = await col.where('menteeId', '==', userId).get();
      docs = q.docs;
    } else if (type === 'received') {
      const q = await col.where('mentorId', '==', userId).get();
      docs = q.docs;
    } else {
      const [q1, q2] = await Promise.all([
        col.where('menteeId', '==', userId).get(),
        col.where('mentorId', '==', userId).get(),
      ]);
      docs = [...q1.docs, ...q2.docs];
      // dedupe
      const seen = new Map();
      for (const d of docs) {
        seen.set(String(d.id), d);
      }
      docs = Array.from(seen.values());
    }

    let rows = docs.map(d => ({ id: d.id, ...d.data() }));
    if (status !== 'all') rows = rows.filter(r => r.status === status);
    rows.sort((a, b) => new Date(b.createdAt || b.requestedAt || 0) - new Date(a.createdAt || a.requestedAt || 0));

    const total = rows.length;
    const p = parseInt(page);
    const l = parseInt(limit);
    const offset = (p - 1) * l;
    const paged = rows.slice(offset, offset + l);

    const enriched = await Promise.all(paged.map(attachUsersAndOnboarding));

    res.json({
      success: true,
      data: {
        requests: enriched,
        pagination: { total, page: p, limit: l, totalPages: Math.ceil(total / l) }
      }
    });
  } catch (error) {
    console.error("Get mentorship requests error:", error);
    res.status(500).json({ success: false, message: "Failed to get mentorship requests", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

// Respond to a mentorship request (Firestore)
const respondToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, mentorNotes } = req.body; // action: "accept" or "reject"
    const userId = req.user.id;

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be either 'accept' or 'reject'" });
    }

    const request = await mentorshipRepo.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: "Mentorship request not found" });
    }

    const isMentor = request.mentorId === userId;
    const isMentee = request.menteeId === userId;
    if (!isMentor && !isMentee) {
      return res.status(403).json({ success: false, message: "You can only respond to your own mentorship requests" });
    }
    if (!isMentor && action === 'accept') {
      return res.status(403).json({ success: false, message: "Only mentors can accept mentorship requests" });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request has already been ${request.status}` });
    }
    if (request.expiresAt && new Date() > new Date(request.expiresAt)) {
      await mentorshipRepo.updateById(requestId, { status: 'expired' });
      return res.status(400).json({ success: false, message: "This request has expired" });
    }

    const updateData = {
      status: action === 'accept' ? 'accepted' : 'rejected',
      respondedAt: new Date().toISOString(),
      mentorNotes: mentorNotes || null
    };

    await mentorshipRepo.updateById(requestId, updateData);
    const updatedRequest = await mentorshipRepo.findById(requestId);
    const enriched = await attachUsersAndOnboarding(updatedRequest);

    try {
      const mentor = enriched.mentor ? enriched.mentor : await userRepo.findById(request.mentorId);
      await notificationService.notifyMentorshipResponse(request.menteeId, mentor, action === 'accept', mentorNotes);
    } catch (notificationError) {
      console.error("Failed to send mentorship response notification:", notificationError);
    }

    if (action === 'accept') {
      try {
        const mentee = enriched.mentee ? enriched.mentee : await userRepo.findById(request.menteeId);
        const mentor = enriched.mentor ? enriched.mentor : await userRepo.findById(request.mentorId);
        const service = emailService.getInstance();
        await service.sendMentorshipAcceptedEmail(mentee.email, mentee.name, mentor.name);
        console.log('✅ Mentorship accepted email sent to mentee:', mentee.email);
      } catch (emailError) {
        console.error('❌ Failed to send mentorship accepted email:', emailError);
      }
    }

    res.json({ success: true, message: `Mentorship request ${action}ed successfully`, data: { request: enriched } });
  } catch (error) {
    console.error("Respond to mentorship request error:", error);
    res.status(500).json({ success: false, message: "Failed to respond to mentorship request", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

// Cancel a mentorship request (by mentee) - Firestore
const cancelRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const request = await mentorshipRepo.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: "Mentorship request not found" });
    }
    if (request.menteeId !== userId) {
      return res.status(403).json({ success: false, message: "You can only cancel your own requests" });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot cancel a request that has been ${request.status}` });
    }

    await mentorshipRepo.updateById(requestId, { status: 'cancelled', respondedAt: new Date().toISOString() });
    res.json({ success: true, message: "Mentorship request cancelled successfully" });
  } catch (error) {
    console.error("Cancel mentorship request error:", error);
    res.status(500).json({ success: false, message: "Failed to cancel mentorship request", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

// Get mentorship statistics (Firestore)
const getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getFirestore();
    const col = db.collection('mentorship_requests');

    const stats = {
      sent: { total: 0, pending: 0, accepted: 0, rejected: 0, cancelled: 0, expired: 0 },
      received: { total: 0, pending: 0, accepted: 0, rejected: 0, cancelled: 0, expired: 0 }
    };

    // Sent
    if (req.user.role === 'user') {
      const q = await col.where('menteeId', '==', userId).get();
      q.forEach(d => {
        const s = (d.data().status) || 'pending';
        if (stats.sent[s] !== undefined) stats.sent[s] += 1;
        stats.sent.total += 1;
      });
    }

    // Received
    if (req.user.role === 'mentor') {
      const q = await col.where('mentorId', '==', userId).get();
      q.forEach(d => {
        const s = (d.data().status) || 'pending';
        if (stats.received[s] !== undefined) stats.received[s] += 1;
        stats.received.total += 1;
      });
    }

    res.json({ success: true, data: { stats } });
  } catch (error) {
    console.error("Get mentorship stats error:", error);
    res.status(500).json({ success: false, message: "Failed to get mentorship statistics", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

// Admin function to assign mentee to mentor directly (Firestore)
const adminAssignMentee = async (req, res) => {
  try {
    const { mentorId, menteeId, adminNotes } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can assign mentees to mentors" });
    }

    const mentor = await userRepo.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor' || !mentor.approved) {
      return res.status(400).json({ success: false, message: "Invalid or unapproved mentor" });
    }
    const mentee = await userRepo.findById(menteeId);
    if (!mentee || mentee.role !== 'user') {
      return res.status(400).json({ success: false, message: "Invalid mentee" });
    }

    const existing = await mentorshipRepo.findAcceptedBetweenUsers(mentorId, menteeId);
    if (existing) {
      return res.status(400).json({ success: false, message: "Mentorship already exists between these users" });
    }

    const assignment = await mentorshipRepo.create({
      mentorId, menteeId, status: 'accepted', message: 'Admin assignment', mentorNotes: adminNotes || 'Assigned by admin'
    });
    await mentorshipRepo.updateById(assignment.id, { respondedAt: new Date().toISOString(), requestedAt: new Date().toISOString() });

    const completeAssignment = await attachUsersAndOnboarding(await mentorshipRepo.findById(assignment.id));

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

    res.status(201).json({ success: true, message: "Mentee assigned to mentor successfully", data: { assignment: completeAssignment } });
  } catch (error) {
    console.error("Admin assign mentee error:", error);
    res.status(500).json({ success: false, message: "Failed to assign mentee to mentor", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

// Get active mentorships (Firestore)
const getActiveMentorships = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role } = req.user;
    const db = getFirestore();
    const col = db.collection('mentorship_requests');

    let docs = [];
    if (role === 'mentor') {
      const q = await col.where('status', '==', 'accepted').where('mentorId', '==', userId).get();
      docs = q.docs;
    } else if (role === 'user') {
      const q = await col.where('status', '==', 'accepted').where('menteeId', '==', userId).get();
      docs = q.docs;
    } else {
      const [q1, q2] = await Promise.all([
        col.where('status', '==', 'accepted').where('mentorId', '==', userId).get(),
        col.where('status', '==', 'accepted').where('menteeId', '==', userId).get(),
      ]);
      docs = [...q1.docs, ...q2.docs];
      const seen = new Map();
      for (const d of docs) seen.set(String(d.id), d);
      docs = Array.from(seen.values());
    }

    let rows = docs.map(d => ({ id: d.id, ...d.data() }));
    rows.sort((a, b) => new Date(b.respondedAt || b.updatedAt || 0) - new Date(a.respondedAt || a.updatedAt || 0));
    const enriched = await Promise.all(rows.map(attachUsersAndOnboarding));

    res.json({ success: true, data: { mentorships: enriched } });
  } catch (error) {
    console.error("Get active mentorships error:", error);
    res.status(500).json({ success: false, message: "Failed to get active mentorships", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

// Get unassigned mentees (for admin) - Firestore
const getUnassignedMentees = async (req, res) => {
  try {
    console.log(`👥 ADMIN REQUEST: Getting unassigned mentees for admin user ${req.user.id}`);
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can view unassigned mentees' });
    }

    const db = getFirestore();
    const reqCol = db.collection('mentorship_requests');
    const usersCol = db.collection('users');

    // Find all accepted mentorships to collect mentee IDs
    const acceptedSnap = await reqCol.where('status', '==', 'accepted').get();
    const assignedMenteeIds = new Set();
    acceptedSnap.forEach(d => { const data = d.data(); if (data.menteeId) assignedMenteeIds.add(String(data.menteeId)); });

    // Fetch all active users with role 'user'
    const usersSnap = await usersCol.where('isActive', '==', true).where('role', '==', 'user').get();
    const unassigned = [];
    for (const d of usersSnap.docs) {
      const data = d.data();
      const idStr = String(d.id);
      if (!assignedMenteeIds.has(idStr)) {
        const onboardingData = await onboardingRepo.findByUserId(parseInt(d.id, 10));
        unassigned.push({
          id: parseInt(d.id, 10),
          name: data.name,
          email: data.email,
          avatar: data.avatar || null,
          createdAt: data.createdAt || null,
          onboardingData: onboardingData || null,
        });
      }
    }

    // Sort by createdAt DESC
    unassigned.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.json({ success: true, data: { unassignedMentees: unassigned } });
  } catch (error) {
    console.error('Get unassigned mentees error:', error);
    res.status(500).json({ success: false, message: 'Failed to get unassigned mentees', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
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
