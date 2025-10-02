const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationCount
} = require("../controllers/notificationController");
const { authenticateToken } = require("../middleware/auth");

// All notification routes require authentication
router.use(authenticateToken);

// Get notifications for current user
router.get("/", getNotifications);

// Get unread notification count
router.get("/count", getNotificationCount);

// Mark specific notification as read
router.patch("/:notificationId/read", markAsRead);

// Mark all notifications as read
router.patch("/read-all", markAllAsRead);

// Delete specific notification
router.delete("/:notificationId", deleteNotification);

module.exports = router;
