const { body, param, query, validationResult } = require("express-validator");

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

const validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),
  
  body("role")
    .optional()
    .isIn(["user", "mentor"])
    .withMessage("Role must be either 'user' or 'mentor'"),
  
  body("phone")
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage("Invalid phone number format"),
  
  handleValidationErrors
];

const validateLogin = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  
  handleValidationErrors
];

const validateOnboarding = [
  body("age")
    .optional()
    .isInt({ min: 13, max: 120 })
    .withMessage("Age must be between 13 and 120"),
  
  body("goals")
    .optional()
    .isArray()
    .withMessage("Goals must be an array"),
  
  body("struggles")
    .optional()
    .isArray()
    .withMessage("Struggles must be an array"),
  
  body("availability")
    .optional()
    .isObject()
    .withMessage("Availability must be an object"),
  
  body("timeZone")
    .optional()
    .isString()
    .withMessage("Time zone must be a string"),
  
  body("preferredCommunicationStyle")
    .optional()
    .isIn(["direct", "supportive", "motivational", "analytical"])
    .withMessage("Invalid communication style"),
  
  handleValidationErrors
];

const validateMessage = [
  body("content")
    .notEmpty()
    .withMessage("Message content is required")
    .isLength({ max: 5000 })
    .withMessage("Message content too long"),
  
  body("type")
    .optional()
    .isIn(["text", "file", "video", "image", "audio"])
    .withMessage("Invalid message type"),
  
  body("receiverId")
    .optional()
    .isInt()
    .withMessage("Receiver ID must be an integer"),
  
  body("roomId")
    .optional()
    .isInt()
    .withMessage("Room ID must be an integer"),
  
  handleValidationErrors
];

const validateTask = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Task title is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),
  
  body("description")
    .notEmpty()
    .withMessage("Task description is required"),
  
  body("menteeId")
    .isInt()
    .withMessage("Mentee ID is required and must be an integer"),
  
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Invalid priority level"),
  
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid due date format"),
  
  handleValidationErrors
];

const validateRoom = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Room name is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Room name must be between 3 and 100 characters"),
  
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be less than 500 characters"),
  
  body("category")
    .optional()
    .isIn(["mentorship", "goals", "accountability", "support", "skills", "networking", "wellness"])
    .withMessage("Invalid category"),
  
  body("isPrivate")
    .optional()
    .isBoolean()
    .withMessage("isPrivate must be a boolean"),
  
  body("maxMembers")
    .optional()
    .isInt({ min: 2, max: 1000 })
    .withMessage("Max members must be between 2 and 1000"),
  
  handleValidationErrors
];

// Validate only the ID params that actually exist on the route
const validateId = [
  param("id").optional().isInt().withMessage("Invalid id parameter"),
  param("taskId").optional().isInt().withMessage("Invalid taskId parameter"),
  param("userId").optional().isInt().withMessage("Invalid userId parameter"),
  param("mentorId").optional().isInt().withMessage("Invalid mentorId parameter"),
  param("roomId").optional().isInt().withMessage("Invalid roomId parameter"),
  handleValidationErrors
];

const validateTaskId = [
  param("taskId")
    .isInt()
    .withMessage("Invalid task ID"),
  
  handleValidationErrors
];

// Specific validation for different ID parameters
const validateMentorApproval = [
  param("mentorId")
    .isInt()
    .withMessage("Invalid mentor ID"),
  
  body("approved")
    .isBoolean()
    .withMessage("Approved field must be a boolean"),
    
  body("adminNotes")
    .optional()
    .isString()
    .withMessage("Admin notes must be a string"),
  
  handleValidationErrors
];

const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateOnboarding,
  validateMessage,
  validateTask,
  validateRoom,
  validateId,
  validateTaskId,
  validateMentorApproval,
  validatePagination,
  handleValidationErrors
};

