const express = require("express");
const router = express.Router();
const {
  sendMessage,
  getDirectMessages,
  getRoomMessages,
  getConversations,
  deleteMessage,
  editMessage,
  markMessagesAsDelivered
} = require("../controllers/messageController");
const { authenticateToken } = require("../middleware/auth");
const { validateMessage, validateId, validatePagination } = require("../middleware/validation");

// All routes require authentication
router.use(authenticateToken);

router.post("/", validateMessage, sendMessage);
router.post("/delivered", markMessagesAsDelivered);
router.get("/conversations", validatePagination, getConversations);
router.get("/direct/:otherUserId", validateId, validatePagination, getDirectMessages);
router.get("/room/:roomId", validateId, validatePagination, getRoomMessages);
router.put("/:messageId", validateId, editMessage);
router.delete("/:messageId", validateId, deleteMessage);

module.exports = router;

