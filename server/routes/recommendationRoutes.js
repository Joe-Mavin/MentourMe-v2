const express = require("express");
const router = express.Router();
const {
  getRecommendations,
  getFilters
} = require("../controllers/recommendationController");
const { createRequest } = require("../controllers/mentorshipController");
const { authenticateToken } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

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

// All routes require authentication
router.use(authenticateToken);

// Get personalized recommendations
router.get("/", getRecommendations);

// Get available filters for recommendations
router.get("/filters", getFilters);

// Create a mentorship request from recommendations
router.post("/request", validateMentorshipRequest, createRequest);

module.exports = router;

