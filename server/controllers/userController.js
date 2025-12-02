const userRepo = require("../repositories/userRepository");

const searchUsers = async (req, res) => {
  try {
    const { q, role, limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    
    console.log(`🔍 USER SEARCH: q="${q}", role="${role}", limit=${limit}, page=${page}`);

    if (!q && !role) {
      return res.status(400).json({
        success: false,
        message: "Either search query or role filter is required"
      });
    }

    const { rows, count } = await userRepo.findAndCountAll({ q, role, limit: parseInt(limit), page: parseInt(page) });

    console.log(`✅ FOUND ${count} users matching search criteria`);

    res.json({
      success: true,
      data: {
        users: rows.map(userRepo.sanitize),
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id;

    const user = await userRepo.findById(userId);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Hide email for other users unless admin
    if (requestingUserId !== parseInt(userId) && req.user.role !== 'admin') {
      if (user) delete user.email;
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id;
    const { name, phone, avatar } = req.body;

    // Users can only update their own profile unless admin
    if (requestingUserId !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "You can only update your own profile"
      });
    }

    const user = await userRepo.findById(userId);
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Update allowed fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

    await userRepo.updateById(userId, updateData);
    const updatedUser = await userRepo.findById(userId);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  searchUsers,
  getUserProfile,
  updateUserProfile
};
