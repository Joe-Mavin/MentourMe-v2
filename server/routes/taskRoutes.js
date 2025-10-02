const express = require("express");
const router = express.Router();
const {
  createTask,
  getTasks,
  getTask,
  updateTaskStatus,
  updateTask,
  deleteTask,
  getTaskStats
} = require("../controllers/taskController");
const { authenticateToken, requireApproval } = require("../middleware/auth");
const { validateTask, validateId, validateTaskId, validatePagination } = require("../middleware/validation");

// All routes require authentication
router.use(authenticateToken);

router.get("/stats", getTaskStats);
router.get("/", validatePagination, getTasks);
router.post("/", requireApproval, validateTask, createTask);
router.get("/:id", validateId, getTask);
router.put("/:id", validateId, updateTask);
router.patch("/:taskId/status", validateTaskId, updateTaskStatus);
router.delete("/:id", validateId, deleteTask);

module.exports = router;

