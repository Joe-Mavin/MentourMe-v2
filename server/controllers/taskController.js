const { Task, User } = require("../models");
const { Op } = require("sequelize");
const notificationService = require("../services/notificationService");

const createTask = async (req, res) => {
  try {
    const mentorId = req.user.id;
    const {
      menteeId,
      title,
      description,
      priority = "medium",
      dueDate,
      estimatedHours,
      tags = []
    } = req.body;

    // Verify mentor role
    if (req.user.role !== "mentor" || !req.user.approved) {
      return res.status(403).json({
        success: false,
        message: "Only approved mentors can create tasks"
      });
    }

    // Verify mentee exists and is a user
    const mentee = await User.findByPk(menteeId);
    if (!mentee || mentee.role !== "user") {
      return res.status(404).json({
        success: false,
        message: "Mentee not found or invalid role"
      });
    }

    const task = await Task.create({
      mentorId,
      menteeId,
      title,
      description,
      priority,
      dueDate,
      estimatedHours,
      tags
    });

    const completeTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: "mentor",
          attributes: ["id", "name", "avatar"]
        },
        {
          model: User,
          as: "mentee",
          attributes: ["id", "name", "avatar"]
        }
      ]
    });

    // Send notification to mentee about new task
    try {
      await notificationService.notifyTaskAssigned(
        menteeId, 
        completeTask, 
        req.user
      );
    } catch (notificationError) {
      console.error("Failed to send task assignment notification:", notificationError);
      // Don't fail the main operation if notification fails
    }

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: { task: completeTask }
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role } = req.user;
    const { status, priority, page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = {};

    // Filter by role
    if (role === "mentor") {
      whereClause.mentorId = userId;
    } else if (role === "user") {
      whereClause.menteeId = userId;
    } else {
      // Admin can see all tasks
    }

    // Add filters
    if (status) {
      whereClause.status = status;
    }
    if (priority) {
      whereClause.priority = priority;
    }

    const tasks = await Task.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "mentor",
          attributes: ["id", "name", "avatar", "role"]
        },
        {
          model: User,
          as: "mentee",
          attributes: ["id", "name", "avatar", "role"]
        }
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        tasks: tasks.rows,
        pagination: {
          total: tasks.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(tasks.count / limit)
        }
      }
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const task = await Task.findByPk(taskId, {
      include: [
        {
          model: User,
          as: "mentor",
          attributes: ["id", "name", "avatar", "role"]
        },
        {
          model: User,
          as: "mentee",
          attributes: ["id", "name", "avatar", "role"]
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    // Check if user has access to this task
    if (req.user.role !== "admin" && task.mentorId !== userId && task.menteeId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, actualHours, verificationNotes } = req.body;
    const userId = req.user.id;

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    // Check permissions based on status change
    let updateData = { status };

    if (status === "in_progress" || status === "completed") {
      // Mentee can start or complete tasks
      if (task.menteeId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Only the assigned mentee can update task progress"
        });
      }
      
      if (status === "completed") {
        updateData.completedAt = new Date();
        if (actualHours) {
          updateData.actualHours = actualHours;
        }
      }
    } else if (status === "verified" || status === "rejected") {
      // Mentor or admin can verify/reject tasks
      if (task.mentorId !== userId && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only the mentor or admin can verify/reject tasks"
        });
      }
      
      if (status === "verified") {
        updateData.verifiedAt = new Date();
      }
      
      if (verificationNotes) {
        updateData.verificationNotes = verificationNotes;
      }
    }

    await task.update(updateData);

    const updatedTask = await Task.findByPk(taskId, {
      include: [
        {
          model: User,
          as: "mentor",
          attributes: ["id", "name", "avatar"]
        },
        {
          model: User,
          as: "mentee",
          attributes: ["id", "name", "avatar"]
        }
      ]
    });

    // Send appropriate notifications based on status change
    try {
      if (status === "completed") {
        // Notify mentor when mentee completes task
        await notificationService.notifyTaskCompleted(
          task.mentorId,
          updatedTask,
          updatedTask.mentee
        );
      } else if (status === "verified" || status === "rejected") {
        // Notify mentee when mentor verifies/rejects task
        await notificationService.notifyTaskVerified(
          task.menteeId,
          updatedTask,
          status === "verified",
          verificationNotes
        );
      }
    } catch (notificationError) {
      console.error("Failed to send task status notification:", notificationError);
      // Don't fail the main operation if notification fails
    }

    res.json({
      success: true,
      message: "Task status updated successfully",
      data: { task: updatedTask }
    });
  } catch (error) {
    console.error("Update task status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    // Only mentor who created the task can update it
    if (task.mentorId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the task creator can update this task"
      });
    }

    // Remove fields that shouldn't be updated directly
    const allowedFields = ["title", "description", "priority", "dueDate", "estimatedHours", "tags"];
    const filteredData = {};
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    await task.update(filteredData);

    const updatedTask = await Task.findByPk(taskId, {
      include: [
        {
          model: User,
          as: "mentor",
          attributes: ["id", "name", "avatar"]
        },
        {
          model: User,
          as: "mentee",
          attributes: ["id", "name", "avatar"]
        }
      ]
    });

    res.json({
      success: true,
      message: "Task updated successfully",
      data: { task: updatedTask }
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    // Only mentor who created the task or admin can delete it
    if (task.mentorId !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    await task.destroy();

    res.json({
      success: true,
      message: "Task deleted successfully"
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getTaskStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role } = req.user;

    let whereClause = {};
    if (role === "mentor") {
      whereClause.mentorId = userId;
    } else if (role === "user") {
      whereClause.menteeId = userId;
    }

    const stats = await Task.findAll({
      where: whereClause,
      attributes: [
        "status",
        [require("sequelize").fn("COUNT", "*"), "count"]
      ],
      group: ["status"]
    });

    const formattedStats = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      verified: 0,
      rejected: 0
    };

    stats.forEach(stat => {
      formattedStats[stat.status] = parseInt(stat.dataValues.count);
    });

    res.json({
      success: true,
      data: { stats: formattedStats }
    });
  } catch (error) {
    console.error("Get task stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTaskStatus,
  updateTask,
  deleteTask,
  getTaskStats
};

