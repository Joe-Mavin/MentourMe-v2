const express = require("express");
const router = express.Router();
const {
  getRooms,
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomMembers,
  updateRoomMember,
  getJoinedRooms,
  addRoomMember
} = require("../controllers/roomController");
const { authenticateToken } = require("../middleware/auth");
const { validateRoom, validateId, validatePagination } = require("../middleware/validation");

// All routes require authentication
router.use(authenticateToken);

router.get("/", validatePagination, getRooms);
router.post("/", validateRoom, createRoom);
router.get("/joined", validatePagination, getJoinedRooms);
router.post("/:roomId/join", validateId, joinRoom);
router.post("/:roomId/leave", validateId, leaveRoom);
router.get("/:roomId/members", validateId, validatePagination, getRoomMembers);
router.post("/:roomId/members", validateId, addRoomMember);
router.put("/:roomId/members/:memberId", updateRoomMember);

module.exports = router;

