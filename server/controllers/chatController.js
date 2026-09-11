const ChatMessage = require("../models/ChatMessage");

// 1. Lấy danh sách tất cả các phòng chat (roomId) duy nhất + tin nhắn cuối cùng
exports.getChatRooms = async (req, res) => {
  try {
    // Lấy tất cả tin nhắn và nhóm theo roomId
    const rooms = await ChatMessage.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$roomId",
          lastMessage: { $first: "$message" },
          senderName: { $first: "$senderName" },
          lastTime: { $first: "$createdAt" },
          sender: { $first: "$sender" }
        }
      },
      { $sort: { lastTime: -1 } }
    ]);

    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách phòng chat", error: error.message });
  }
};

// 2. Lấy lịch sử tin nhắn của một roomId cụ thể
exports.getChatHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    const history = await ChatMessage.find({ roomId }).sort({ createdAt: 1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy lịch sử tin nhắn", error: error.message });
  }
};