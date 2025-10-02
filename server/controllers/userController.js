const { User } = require("../models");
const { Op } = require("sequelize");

const searchUsers = async (req, res) => {
  try {
    const { q, role, limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    
    console.log(`🔍 USER SEARCH: q="${q}", role="${role}", limit=${limit}, page=${page}`);

    let whereClause = {
      [Op.and]: [
        { isActive: true }
      ]
    };

    // Add search query if provided
    if (q && q.trim().length >= 2) {
      whereClause[Op.and].push({
        [Op.or]: [
          { name: { [Op.like]: `%${q.trim()}%` } },
          { email: { [Op.like]: `%${q.trim()}%` } }
        ]
      });
    }

    // Filter by role if specified (map mentee to user for compatibility)
    if (role) {
      const roleMapping = {
        'mentee': 'user',
        'user': 'user', 
        'mentor': 'mentor',
        'admin': 'admin'
      };
      
      const mappedRole = roleMapping[role];
      if (mappedRole) {
        whereClause[Op.and].push({ role: mappedRole });
      }
    }

    // If no query and no role, return error
    if (!q && !role) {
      return res.status(400).json({
        success: false,
        message: "Either search query or role filter is required"
      });
    }

    console.log(`🔍 WHERE CLAUSE:`, JSON.stringify(whereClause, null, 2));
    
    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'avatar', 'role', 'createdAt'],
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    console.log(`✅ FOUND ${users.count} users matching search criteria`);

    res.json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          total: users.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(users.count / limit)
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

    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'avatar', 'role', 'phone', 'approved', 'isActive', 'createdAt']
    });

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Hide email for other users unless admin
    if (requestingUserId !== parseInt(userId) && req.user.role !== 'admin') {
      delete user.dataValues.email;
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

    const user = await User.findByPk(userId);
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

    await user.update(updateData);

    const updatedUser = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'avatar', 'role', 'phone', 'approved', 'isActive', 'createdAt']
    });

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
