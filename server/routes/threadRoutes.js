const express = require("express");
const {
  startThread,
  listThreads,
  unreadCount,
  getMessages,
  sendMessage,
  markRead,
} = require("../controllers/threadController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// Fixed paths must come before "/:id".
router.post("/", startThread);
router.get("/", listThreads);
router.get("/unread-count", unreadCount);
router.get("/:id/messages", getMessages);
router.post("/:id/messages", sendMessage);
router.patch("/:id/read", markRead);

module.exports = router;
