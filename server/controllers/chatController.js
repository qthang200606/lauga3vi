const ChatMessage = require("../models/ChatMessage");

// 1. Lấy danh sách phòng chat duy nhất + Lookup trực tiếp sang bảng users lấy tên thật
exports.getChatRooms = async (req, res) => {
  try {
    const rooms = await ChatMessage.aggregate([
      // Bước 1: Sắp xếp tin nhắn mới nhất lên đầu
      { $sort: { createdAt: -1 } },

      // Bước 2: Nhóm theo roomId
      {
        $group: {
          _id: "$roomId",
          lastMessage: { $first: "$message" },
          userId: { $first: "$userId" },
          lastTime: { $first: "$createdAt" },
          sender: { $first: "$sender" }
        }
      },

      // Bước 3: Chuyển đổi ID về kiểu ObjectId chuẩn để Lookup
      {
        $addFields: {
          extractedUserId: {
            $cond: {
              // Nếu đã có userId dạng ObjectId/String
              if: { $and: [{ $ne: ["$userId", null] }, { $ne: ["$userId", ""] }] },
              then: { $toObjectId: "$userId" },
              else: {
                $cond: {
                  // Nếu không có userId nhưng roomId dạng "user_24kytuhex"
                  if: { $regexMatch: { input: "$_id", regex: /^user_[0-9a-fA-F]{24}$/ } },
                  then: { $toObjectId: { $substrCP: ["$_id", 5, 24] } },
                  else: null
                }
              }
            }
          }
        }
      },

      // Bước 4: Lookup trực tiếp sang collection `users`
      {
        $lookup: {
          from: "users",
          localField: "extractedUserId",
          foreignField: "_id",
          as: "userInfo"
        }
      },

      // Bước 5: Bỏ hẳn senderName cũ, dùng senderName động lấy từ DB users
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
              else: "Khách vãng lai" // Chỉ bị nếu không phải tài khoản trong DB
            }
          }
        }
      },

      // Bước 6: Sắp xếp danh sách phòng mới nhất lên trên
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