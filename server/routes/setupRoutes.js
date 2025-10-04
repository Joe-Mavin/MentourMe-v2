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
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash("Admin123!", salt);
    
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
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash("Mentor123!", salt);
      
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
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash("Mentor123!", salt);
    
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
 * Reset John Mentor password to default with verification
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

    const newPassword = "Mentor123!";
    
    // Hash password exactly like User model does (genSalt + hash)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password directly in database
    await johnUser.update({
      password: hashedPassword,
      emailVerified: true,
      isActive: true,
      approved: true
    });

    // Verify the password was set correctly
    const updatedUser = await User.findOne({
      where: { email: "john.mentor@example.com" }
    });
    
    const passwordTest = await bcrypt.compare(newPassword, updatedUser.password);

    console.log("✅ John Mentor password reset successfully");
    console.log("🔍 Password verification:", passwordTest);

    res.json({
      success: true,
      message: "Password reset and verified successfully",
      data: {
        email: "john.mentor@example.com",
        password: "Mentor123!",
        role: johnUser.role,
        passwordVerified: passwordTest,
        hashPreview: hashedPassword.substring(0, 20) + "..."
      }
    });

  } catch (error) {
    console.error("❌ Failed to reset password:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message
    });
  }
});

/**
 * POST /api/setup/debug-login
 * Debug login issues for John Mentor with multiple test methods
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

    // Test password comparison using model method
    const isPasswordValidModel = await user.comparePassword(password);
    
    // Test password comparison using direct bcrypt
    const bcrypt = require('bcryptjs');
    const isPasswordValidDirect = await bcrypt.compare(password, user.password);
    
    // Test with different password variations
    const testPasswords = [
      "Mentor123!",
      "mentor123!",
      "MENTOR123!",
      "Mentor123"
    ];
    
    const passwordTests = {};
    for (const testPwd of testPasswords) {
      passwordTests[testPwd] = await bcrypt.compare(testPwd, user.password);
    }
    
    res.json({
      success: true,
      debug: {
        userFound: true,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        approved: user.approved,
        emailVerified: user.emailVerified,
        passwordValidModel: isPasswordValidModel,
        passwordValidDirect: isPasswordValidDirect,
        passwordTests: passwordTests,
        hashedPassword: user.password.substring(0, 30) + "...",
        testPassword: password,
        hashType: user.password.substring(0, 4) // Show hash type ($2a$, $2b$, etc.)
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
 * POST /api/setup/force-login
 * Force create a working login for John Mentor by setting a simple password
 */
router.post("/force-login", async (req, res) => {
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

    // Set a simple password that we know will work
    const simplePassword = "password123";
    
    // Force the password change to trigger the beforeUpdate hook
    johnUser.set('password', simplePassword);
    await johnUser.save();

    // Test the password immediately
    const updatedUser = await User.findOne({
      where: { email: "john.mentor@example.com" }
    });
    
    const bcrypt = require('bcryptjs');
    const passwordTest = await bcrypt.compare(simplePassword, updatedUser.password);
    const modelTest = await updatedUser.comparePassword(simplePassword);

    res.json({
      success: true,
      message: "Simple password set successfully",
      data: {
        email: "john.mentor@example.com",
        password: simplePassword,
        role: johnUser.role,
        directBcryptTest: passwordTest,
        modelMethodTest: modelTest,
        hookTriggered: johnUser.changed('password'),
        newHashPreview: updatedUser.password.substring(0, 30) + "...",
        instructions: "Try logging in with this simple password first"
      }
    });

  } catch (error) {
    console.error("❌ Failed to set simple password:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set simple password",
      error: error.message
    });
  }
});

/**
 * POST /api/setup/nuclear-reset
 * Nuclear option: Delete and recreate John Mentor user from scratch
 */
router.post("/nuclear-reset", async (req, res) => {
  try {
    // Delete existing user completely
    await User.destroy({
      where: { email: "john.mentor@example.com" }
    });

    // Create fresh user (this will trigger beforeCreate hook)
    const newUser = await User.create({
      name: "John Mentor",
      email: "john.mentor@example.com",
      password: "password123", // beforeCreate hook will hash this
      role: "admin",
      approved: true,
      isActive: true,
      emailVerified: true,
      phone: "+1234567890"
    });

    // Test the password immediately
    const bcrypt = require('bcryptjs');
    const passwordTest = await bcrypt.compare("password123", newUser.password);
    const modelTest = await newUser.comparePassword("password123");

    res.json({
      success: true,
      message: "User completely recreated",
      data: {
        email: "john.mentor@example.com",
        password: "password123",
        role: newUser.role,
        directBcryptTest: passwordTest,
        modelMethodTest: modelTest,
        hashPreview: newUser.password.substring(0, 30) + "...",
        instructions: "Fresh user created - try logging in with password123"
      }
    });

  } catch (error) {
    console.error("❌ Failed to recreate user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to recreate user",
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
