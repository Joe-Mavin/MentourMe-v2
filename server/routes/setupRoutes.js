const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { User } = require("../models");

/**
 * POST /api/setup/admin
 * Creates the initial admin user if no admin exists
 * This is a one-time setup endpoint for production deployment
 */
router.post("/admin", async (req, res) => {
  try {
    // Check if any admin user already exists
    const existingAdmin = await User.findOne({
      where: { role: "admin" }
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin user already exists"
      });
    }

    // Create the admin user
    const hashedPassword = await bcrypt.hash("Admin123!", 12);
    
    const adminUser = await User.create({
      name: "Admin User",
      email: "admin@mentourme.com",
      password: hashedPassword,
      role: "admin",
      approved: true,
      isActive: true,
      emailVerified: true
    });

    console.log("✅ Admin user created successfully:", adminUser.email);

    res.json({
      success: true,
      message: "Admin user created successfully",
      data: {
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      }
    });

  } catch (error) {
    console.error("❌ Failed to create admin user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create admin user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

/**
 * POST /api/setup/restore-john-mentor
 * Restores the John Mentor admin user specifically
 */
router.post("/restore-john-mentor", async (req, res) => {
  try {
    // Check if John Mentor already exists
    const existingJohn = await User.findOne({
      where: { email: "john.mentor@example.com" }
    });

    if (existingJohn) {
      // Update to ensure admin privileges AND reset password
      const hashedPassword = await bcrypt.hash("Mentor123!", 12);
      
      await existingJohn.update({
        password: hashedPassword, // Reset password to known value
        role: "admin",
        approved: true,
        isActive: true,
        emailVerified: true
      });

      return res.json({
        success: true,
        message: "John Mentor user updated with admin privileges",
        data: {
          email: existingJohn.email,
          name: existingJohn.name,
          role: existingJohn.role
        }
      });
    }

    // Create John Mentor with admin role
    const hashedPassword = await bcrypt.hash("Mentor123!", 12);
    
    const johnUser = await User.create({
      name: "John Mentor",
      email: "john.mentor@example.com",
      password: hashedPassword,
      role: "admin", // Give admin role for mentor approval
      approved: true,
      isActive: true,
      emailVerified: true,
      phone: "+1234567890"
    });

    console.log("✅ John Mentor admin user created:", johnUser.email);

    res.json({
      success: true,
      message: "John Mentor admin user created successfully",
      data: {
        email: johnUser.email,
        name: johnUser.name,
        role: johnUser.role
      }
    });

  } catch (error) {
    console.error("❌ Failed to restore John Mentor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to restore John Mentor user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

/**
 * POST /api/setup/reset-john-password
 * Reset John Mentor password to default
 */
router.post("/reset-john-password", async (req, res) => {
  try {
    const johnUser = await User.findOne({
      where: { email: "john.mentor@example.com" }
    });

    if (!johnUser) {
      return res.status(404).json({
        success: false,
        message: "John Mentor user not found"
      });
    }

    // Reset password to known value
    const hashedPassword = await bcrypt.hash("Mentor123!", 12);
    
    await johnUser.update({
      password: hashedPassword,
      emailVerified: true,
      isActive: true
    });

    console.log("✅ John Mentor password reset successfully");

    res.json({
      success: true,
      message: "Password reset successfully",
      data: {
        email: "john.mentor@example.com",
        password: "Mentor123!",
        role: johnUser.role
      }
    });

  } catch (error) {
    console.error("❌ Failed to reset password:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password"
    });
  }
});

/**
 * POST /api/setup/debug-login
 * Debug login issues for John Mentor
 */
router.post("/debug-login", async (req, res) => {
  try {
    const { email = "john.mentor@example.com", password = "Mentor123!" } = req.body;
    
    // Find user
    const user = await User.findOne({ 
      where: { email }
    });

    if (!user) {
      return res.json({
        success: false,
        debug: {
          userFound: false,
          email: email
        }
      });
    }

    // Test password comparison
    const isPasswordValid = await user.comparePassword(password);
    
    res.json({
      success: true,
      debug: {
        userFound: true,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        approved: user.approved,
        emailVerified: user.emailVerified,
        passwordValid: isPasswordValid,
        hashedPassword: user.password.substring(0, 20) + "...", // Show first 20 chars
        testPassword: password
      }
    });

  } catch (error) {
    console.error("❌ Debug login error:", error);
    res.status(500).json({
      success: false,
      message: "Debug failed",
      error: error.message
    });
  }
});

/**
 * GET /api/setup/status
 * Check setup status - shows if admin users exist
 */
router.get("/status", async (req, res) => {
  try {
    const adminCount = await User.count({
      where: { role: "admin" }
    });

    const johnExists = await User.findOne({
      where: { email: "john.mentor@example.com" }
    });

    const totalUsers = await User.count();

    res.json({
      success: true,
      data: {
        adminUsersCount: adminCount,
        johnMentorExists: !!johnExists,
        johnMentorRole: johnExists?.role || null,
        totalUsers,
        needsSetup: adminCount === 0
      }
    });

  } catch (error) {
    console.error("Setup status check error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check setup status"
    });
  }
});

module.exports = router;
