const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken
} = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");
const { validateRegister, validateLogin } = require("../middleware/validation");

// ✅ FIX: Create specific auth limiter for login/register only
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 5, // 5 attempts per minute
  message: {
    success: false,
    message: "Too many login attempts. Please wait 1 minute before trying again.",
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Only count failed attempts
});

// Public routes - ✅ Apply rate limiter only to these specific routes
router.post("/register", authLimiter, validateRegister, register);
router.post("/login", authLimiter, validateLogin, login);

// ✅ TEMP: Create test mentor for authentication testing
router.post("/create-test-mentor", async (req, res) => {
  try {
    const userRepo = require('../repositories/userRepository');
    // Check if test mentor already exists
    const existingUser = await userRepo.findByEmail('mentor@test.com');
    if (existingUser) {
      return res.json({
        success: true,
        message: 'Test mentor already exists',
        data: { user: existingUser }
      });
    }
    
    // Create test mentor
    const user = await userRepo.create({
      name: 'Test Mentor',
      email: 'mentor@test.com',
      password: 'password123',
      role: 'mentor'
    });
    await userRepo.updateById(user.id, { approved: true, isActive: true });
    
    console.log('✅ Created test mentor:', user.email);
    
    res.json({
      success: true,
      message: 'Test mentor created successfully',
      data: { 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Error creating test mentor:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ TEMP: Test profile with onboarding data
router.get("/test-profile/:userId", async (req, res) => {
  try {
    const userRepo = require('../repositories/userRepository');
    const onboardingRepo = require('../repositories/onboardingRepository');
    const { userId } = req.params;
    const user = await userRepo.findById(userId);
    const onboarding = await onboardingRepo.findByUserId(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.json({
      success: true,
      data: { 
        user,
        hasOnboardingData: !!onboarding,
        onboardingCompleted: !!onboarding?.completedAt
      }
    });
  } catch (error) {
    console.error('Test profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Protected routes - ✅ RESTORED PROPER AUTHENTICATION
router.use(authenticateToken);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);
router.post("/refresh-token", refreshToken);

module.exports = router;

