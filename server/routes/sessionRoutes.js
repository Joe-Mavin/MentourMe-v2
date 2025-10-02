const express = require('express');
const router = express.Router();
const {
  scheduleSession,
  getUserSessions,
  getSession,
  updateSession,
  completeSession,
  getSessionStats
} = require('../controllers/sessionController');

// Import auth middleware
const { authenticateToken } = require('../middleware/auth');

// Test route without auth to check basic routing
router.get('/ping', (req, res) => {
  console.log('🏓 PING route hit - basic routing works');
  res.json({ success: true, message: 'Session routes are working', timestamp: new Date() });
});

// All other session routes require authentication
router.use(authenticateToken);

// Test route to verify sessions endpoint is working
router.get('/test', (req, res) => {
  console.log('🧪 SESSION TEST ROUTE HIT');
  res.json({ success: true, message: 'Sessions endpoint is working', user: req.user?.id });
});

// Session management routes
router.post('/', scheduleSession);                    // POST /api/sessions - Schedule new session
router.get('/', getUserSessions);                     // GET /api/sessions - Get user's sessions
router.get('/stats', getSessionStats);                // GET /api/sessions/stats - Get session statistics
router.get('/:id', getSession);                       // GET /api/sessions/:id - Get session details
router.put('/:id', updateSession);                    // PUT /api/sessions/:id - Update session
router.post('/:id/complete', completeSession);        // POST /api/sessions/:id/complete - Complete session with feedback

module.exports = router;
