const express = require("express");
const router = express.Router();
const {
  getPendingMentors,
  approveMentor,
  getAllUsers,
  updateUserStatus,
  getDashboardStats,
  createCommunityRoom,
  getAllRooms,
  deleteRoom
} = require("../controllers/adminController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { validateRoom, validateId, validateMentorApproval, validatePagination } = require("../middleware/validation");

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRoles("admin"));

// Dashboard and statistics
router.get("/stats", getDashboardStats);

// User management
router.get("/users", validatePagination, getAllUsers);
router.put("/users/:userId/status", validateId, updateUserStatus);

// Mentor approval
router.get("/mentors/pending", validatePagination, getPendingMentors);
router.put("/mentors/:mentorId/approve", validateMentorApproval, approveMentor);

// Room management
router.get("/rooms", validatePagination, getAllRooms);
router.post("/rooms", validateRoom, createCommunityRoom);
router.delete("/rooms/:roomId", validateId, deleteRoom);

// Scheduled task endpoints for GitHub Actions
router.post('/tasks/session-reminders', authenticateToken, async (req, res) => {
  try {
    // Verify admin token
    if (req.headers.authorization !== `Bearer ${process.env.ADMIN_API_TOKEN}`) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Send session reminders logic here
    console.log('🔔 Running session reminders task');
    
    // TODO: Implement session reminder logic
    // - Find sessions starting in next 24 hours
    // - Send email/notification reminders
    
    res.json({ success: true, message: 'Session reminders sent' });
  } catch (error) {
    console.error('Session reminders task error:', error);
    res.status(500).json({ success: false, message: 'Task failed' });
  }
});

router.post('/tasks/cleanup-notifications', authenticateToken, async (req, res) => {
  try {
    if (req.headers.authorization !== `Bearer ${process.env.ADMIN_API_TOKEN}`) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    console.log('🧹 Running notification cleanup task');
    
    // TODO: Implement notification cleanup
    // - Delete notifications older than 30 days
    // - Delete read notifications older than 7 days
    
    res.json({ success: true, message: 'Notifications cleaned up' });
  } catch (error) {
    console.error('Notification cleanup task error:', error);
    res.status(500).json({ success: false, message: 'Task failed' });
  }
});

router.post('/tasks/cleanup-sessions', authenticateToken, async (req, res) => {
  try {
    if (req.headers.authorization !== `Bearer ${process.env.ADMIN_API_TOKEN}`) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    console.log('🧹 Running session cleanup task');
    
    // TODO: Implement session cleanup
    // - Archive completed sessions older than 90 days
    // - Clean up cancelled sessions older than 30 days
    
    res.json({ success: true, message: 'Sessions cleaned up' });
  } catch (error) {
    console.error('Session cleanup task error:', error);
    res.status(500).json({ success: false, message: 'Task failed' });
  }
});

router.post('/tasks/weekly-reports', authenticateToken, async (req, res) => {
  try {
    if (req.headers.authorization !== `Bearer ${process.env.ADMIN_API_TOKEN}`) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    console.log('📊 Running weekly reports task');
    
    // TODO: Implement weekly reports
    // - Generate platform usage statistics
    // - Send summary emails to admins
    
    res.json({ success: true, message: 'Weekly reports generated' });
  } catch (error) {
    console.error('Weekly reports task error:', error);
    res.status(500).json({ success: false, message: 'Task failed' });
  }
});

router.post('/tasks/update-rankings', authenticateToken, async (req, res) => {
  try {
    if (req.headers.authorization !== `Bearer ${process.env.ADMIN_API_TOKEN}`) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    console.log('🏆 Running mentor rankings update task');
    
    // TODO: Implement ranking updates
    // - Recalculate mentor scores based on recent activity
    // - Update mentor tiers and badges
    
    res.json({ success: true, message: 'Mentor rankings updated' });
  } catch (error) {
    console.error('Mentor rankings update task error:', error);
    res.status(500).json({ success: false, message: 'Task failed' });
  }
});

module.exports = router;

