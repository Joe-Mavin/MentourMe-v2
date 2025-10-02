const express = require("express");
const router = express.Router();
const {
  initiateCall,
  acceptCall,
  rejectCall,
  endCall,
  getCallHistory
} = require("../controllers/videoCallController");
const { authenticateToken } = require("../middleware/auth");
const { body, param, query, validationResult } = require("express-validator");

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

const validateInitiateCall = [
  body("targetUserId")
    .isInt()
    .withMessage("Target user ID must be an integer"),
  
  body("callType")
    .optional()
    .isIn(["video", "audio"])
    .withMessage("Call type must be either 'video' or 'audio'"),
    
  body("purpose")
    .optional()
    .isIn([
      "general_session",
      "goal_review", 
      "problem_solving",
      "skill_development",
      "career_guidance",
      "project_review",
      "check_in",
      "emergency"
    ])
    .withMessage("Invalid call purpose"),
    
  body("sessionType")
    .optional()
    .isIn(["mentorship", "follow_up", "emergency"])
    .withMessage("Invalid session type"),
  
  handleValidationErrors
];

const validateCallId = [
  param("callId")
    .matches(/^call_\d+_\d+_\d+$/)
    .withMessage("Invalid call ID format"),
  
  handleValidationErrors
];

const validateEndCall = [
  param("callId")
    .matches(/^call_\d+_\d+_\d+$/)
    .withMessage("Invalid call ID format"),
    
  body("duration")
    .isInt({ min: 0 })
    .withMessage("Duration must be a positive integer (seconds)"),
    
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
    
  body("feedback")
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage("Feedback must be a string with max 1000 characters"),
    
  body("sessionNotes")
    .optional()
    .isString()
    .isLength({ max: 2000 })
    .withMessage("Session notes must be a string with max 2000 characters"),
    
  body("nextSteps")
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage("Next steps must be a string with max 1000 characters"),
    
  body("wasProductive")
    .optional()
    .isBoolean()
    .withMessage("wasProductive must be a boolean"),
  
  handleValidationErrors
];

const validateRejectCall = [
  param("callId")
    .matches(/^call_\d+_\d+_\d+$/)
    .withMessage("Invalid call ID format"),
    
  body("reason")
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage("Reason must be a string with max 200 characters"),
  
  handleValidationErrors
];

const validateCallHistory = [
  query("mentorshipId")
    .isInt()
    .withMessage("Mentorship ID must be an integer"),
    
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
    
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  
  handleValidationErrors
];

// All routes require authentication
router.use(authenticateToken);

// Initiate a mentor-mentee video call
router.post("/initiate", validateInitiateCall, initiateCall);

// Accept an incoming call
router.post("/:callId/accept", validateCallId, acceptCall);

// Reject an incoming call
router.post("/:callId/reject", validateRejectCall, rejectCall);

// End a call with feedback
router.post("/:callId/end", validateEndCall, endCall);

// Get call history for a mentorship
router.get("/history", validateCallHistory, getCallHistory);

module.exports = router;
