const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

// API lấy danh sách các cuộc hội thoại
router.get("/rooms", chatController.getChatRooms);

// API lấy nội dung tin nhắn của 1 phòng
router.get("/history/:roomId", chatController.getChatHistory);

module.exports = router;