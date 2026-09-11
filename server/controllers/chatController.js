const ChatMessage = require("../models/ChatMessage");

// 1. Lấy danh sách phòng chat duy nhất + Tự động join lấy tên thật từ User DB
exports.getChatRooms = async (req, res) => {
  try {
    const rooms = await ChatMessage.aggregate([
      // Bước 1: Sắp xếp tin nhắn mới nhất lên đầu
      { $sort: { createdAt: -1 } },

      // Bước 2: Nhóm theo roomId để lấy tin nhắn cuối
      {
        $group: {
          _id: "$roomId",
          lastMessage: { $first: "$message" },
          senderName: { $first: "$senderName" },
          userId: { $first: "$userId" },
          lastTime: { $first: "$createdAt" },
          sender: { $first: "$sender" }
        }
      },

      // Bước 3: Tách lấy Object ID từ roomId nếu roomId dạng "user_6a78a54..."
      {
        $addFields: {
          extractedUserId: {
            $cond: {
              if: { $regexMatch: { input: "$_id", regex: /^user_[0-9a-fA-F]{24}$/ } },
              then: { $toObjectId: { $substrCP: ["$_id", 5, 24] } },
              else: "$userId"
            }
          }
        }
      },

      // Bước 4: Lookup thẳng sang bảng `users` dựa vào ID vừa bóc tách
      {
        $lookup: {
          from: "users", // Tên collection trong MongoDB
          localField: "extractedUserId",
          foreignField: "_id",
          as: "userInfo"
        }
      },

      // Bước 5: Đè lại senderName nếu tìm thấy User thật trong DB
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          lastTime: 1,
          sender: 1,
          senderName: {
            $cond: {
              if: { $gt: [{ $size: "$userInfo" }, 0] },
              then: { $arrayElemAt: ["$userInfo.name", 0] }, // Lấy tên thật từ User DB
              else: "$senderName" // Giữ nguyên tên cũ nếu không phải user
            }
          }
        }
      },

      // Bước 6: Sắp xếp danh sách phòng theo thời gian nhắn mới nhất
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