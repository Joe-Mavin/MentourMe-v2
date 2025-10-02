const express = require("express");
const router = express.Router();
const {
  createRequest,
  getRequests,
  respondToRequest,
  cancelRequest,
  getStats,
  adminAssignMentee,
  getActiveMentorships,
  getUnassignedMentees
} = require("../controllers/mentorshipController");
const { authenticateToken } = require("../middleware/auth");
const { body, param, validationResult } = require("express-validator");

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation errors",
      errors: errors.array()
    });
  }
  next();
};

const validateMentorshipRequest = [
  body("mentorId")
    .isInt()
    .withMessage("Mentor ID must be an integer"),
  
  body("message")
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage("Message must be a string with max 1000 characters"),
    
  body("matchScore")
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage("Match score must be a number between 0 and 10"),
  
  handleValidationErrors
];

const validateResponse = [
  param("requestId")
    .isInt()
    .withMessage("Request ID must be an integer"),
    
  body("action")
    .isIn(["accept", "reject"])
    .withMessage("Action must be either 'accept' or 'reject'"),
    
  body("mentorNotes")
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage("Mentor notes must be a string with max 500 characters"),
  
  handleValidationErrors
];

const validateRequestId = [
  param("requestId")
    .isInt()
    .withMessage("Request ID must be an integer"),
  
  handleValidationErrors
];

const validateAdminAssignment = [
  body("mentorId")
    .isInt()
    .withMessage("Mentor ID must be an integer"),
  
  body("menteeId")
    .isInt()
    .withMessage("Mentee ID must be an integer"),
    
  body("adminNotes")
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage("Admin notes must be a string with max 500 characters"),
  
  handleValidationErrors
];

// All routes require authentication
router.use(authenticateToken);

// Get statistics
router.get("/stats", getStats);

// Get mentorship requests
router.get("/", getRequests);

// Get active mentorships
router.get("/active", getActiveMentorships);

// Get unassigned mentees (admin only)
router.get("/unassigned-mentees", getUnassignedMentees);

// Create a new mentorship request (POST /api/recommendations/request)
// Note: This route will be mounted at /api/recommendations in server.js
router.post("/request", validateMentorshipRequest, createRequest);

// Admin assign mentee to mentor directly
router.post("/admin-assign", validateAdminAssignment, adminAssignMentee);

// Respond to a mentorship request
router.patch("/:requestId/respond", validateResponse, respondToRequest);

// Cancel a mentorship request
router.patch("/:requestId/cancel", validateRequestId, cancelRequest);

// TEMPORARY: Add session routes here for testing
let sessionController;
try {
  sessionController = require('../controllers/sessionController');
  console.log('✅ Session controller imported successfully');
} catch (error) {
  console.error('❌ Error importing session controller:', error.message);
  sessionController = {};
}

// Test route to verify sessions endpoint is accessible
router.get('/sessions/test', (req, res) => {
  console.log('🧪 MENTORSHIP SESSIONS TEST HIT');
  res.json({ success: true, message: 'Mentorship sessions endpoint is working', user: req.user?.id });
});

// Temporary session routes under /api/mentorship/sessions
router.post('/sessions', (req, res) => {
  console.log('🎯 MENTORSHIP SESSION POST HIT:', req.url, req.body);
  if (sessionController.scheduleSession) {
    sessionController.scheduleSession(req, res);
  } else {
    res.json({
      success: true,
      message: 'Session scheduled successfully (fallback)',
      data: { session: { id: Date.now(), title: req.body.title, status: 'scheduled' } }
    });
  }
});

router.get('/sessions', (req, res) => {
  console.log('🎯 MENTORSHIP SESSION GET HIT:', req.url, req.query);
  if (sessionController.getUserSessions) {
    sessionController.getUserSessions(req, res);
  } else {
    res.json({
      success: true,
      data: {
        sessions: [],
        pagination: { currentPage: 1, totalPages: 1, totalSessions: 0 }
      }
    });
  }
});

router.get('/sessions/stats', (req, res) => {
  if (sessionController.getSessionStats) {
    sessionController.getSessionStats(req, res);
  } else {
    res.json({ success: true, data: { stats: {} } });
  }
});

router.get('/sessions/:id', (req, res) => {
  if (sessionController.getSession) {
    sessionController.getSession(req, res);
  } else {
    res.status(404).json({ success: false, message: 'Session not found' });
  }
});

router.put('/sessions/:id', (req, res) => {
  if (sessionController.updateSession) {
    sessionController.updateSession(req, res);
  } else {
    res.json({ success: true, message: 'Session updated (fallback)' });
  }
});

router.post('/sessions/:id/complete', (req, res) => {
  if (sessionController.completeSession) {
    sessionController.completeSession(req, res);
  } else {
    res.json({ success: true, message: 'Session completed (fallback)' });
  }
});

module.exports = router;
