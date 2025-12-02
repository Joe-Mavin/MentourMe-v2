const jwt = require("jsonwebtoken");
const userRepo = require('../repositories/userRepository');
const onboardingRepo = require('../repositories/onboardingRepository');
const emailService = require('../services/emailService');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const register = async (req, res) => {
  try {
    const { name, email, password, role = "user", phone, bio } = req.body;

    // Check if user already exists
    const existingUser = await userRepo.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create user
    const user = await userRepo.create({ name, email, password, role, phone, bio });

    // Send mentor application email if user is registering as mentor
    if (role === "mentor") {
      try {
        const service = emailService.getInstance();
        await service.sendMentorApplicationReceivedEmail(email, name);
        console.log('✅ Mentor application email sent to:', email);
      } catch (emailError) {
        console.error('❌ Failed to send mentor application email:', emailError);
        // Don't fail registration if email fails
      }
    }

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: userRepo.sanitize(user),
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await userRepo.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordValid = await userRepo.comparePassword(user, password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update last login
    await userRepo.updateById(user.id, { lastLogin: new Date().toISOString() });

    // Generate token
    const token = generateToken(user.id);

    const safeUser = userRepo.sanitize(await userRepo.findById(user.id));
    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: safeUser,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await userRepo.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar, bio } = req.body;
    const userId = req.user.id;

    const user = await userRepo.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user
    await userRepo.updateById(userId, {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(avatar !== undefined && { avatar }),
      ...(bio !== undefined && { bio }),
    });

    const updated = userRepo.sanitize(await userRepo.findById(userId));
    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user: updated },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await userRepo.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await userRepo.comparePassword(user, currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    await userRepo.updateById(userId, { password: newPassword });

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const token = generateToken(userId);

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: { token },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
};

