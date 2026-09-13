const ChatMessage = require("../models/ChatMessage");

// =========================================================
// 1. LẤY DANH SÁCH PHÒNG CHAT
// =========================================================
exports.getChatRooms = async (req, res) => {
  try {
    const rooms = await ChatMessage.aggregate([
      // ---------------------------------------------------
      // Bước 1: Tin nhắn mới nhất lên đầu
      // ---------------------------------------------------
      {
        $sort: {
          createdAt: -1,
        },
      },

      // ---------------------------------------------------
      // Bước 2: Nhóm theo roomId
      // ---------------------------------------------------
      {
        $group: {
          _id: "$roomId",

          // Tin nhắn mới nhất
          lastMessage: {
            $first: "$message",
          },

          lastTime: {
            $first: "$createdAt",
          },

          sender: {
            $first: "$sender",
          },

          // Lấy userId từ bất kỳ tin nhắn nào của khách
          userIds: {
            $addToSet: "$userId",
          },
        },
      },

      // ---------------------------------------------------
      // Bước 3: Xác định userId
      //
      // Ưu tiên lấy trực tiếp từ roomId:
      // user_67a85a5419178f4d61869f1
      //
      // Nếu là guest_xxx thì không có userId
      // ---------------------------------------------------
      {
        $addFields: {
          extractedUserId: {
            $cond: {
              // Nếu roomId có dạng user_ + 24 ký tự hex
              if: {
                $regexMatch: {
                  input: "$_id",
                  regex: /^user_[0-9a-fA-F]{24}$/,
                },
              },

              // Lấy 24 ký tự sau "user_"
              then: {
                $convert: {
                  input: {
                    $substrCP: ["$_id", 5, 24],
                  },
                  to: "objectId",
                  onError: null,
                  onNull: null,
                },
              },

              // Nếu không phải room user_xxx
              else: {
                $let: {
                  vars: {
                    validUserIds: {
                      $filter: {
                        input: "$userIds",
                        as: "uid",
                        cond: {
                          $and: [
                            {
                              $ne: ["$$uid", null],
                            },
                            {
                              $ne: ["$$uid", ""],
                            },
                          ],
                        },
                      },
                    },
                  },

                  in: {
                    $convert: {
                      input: {
                        $arrayElemAt: ["$$validUserIds", 0],
                      },
                      to: "objectId",
                      onError: null,
                      onNull: null,
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ---------------------------------------------------
      // Bước 4: Lookup sang collection users
      // ---------------------------------------------------
      {
        $lookup: {
          from: "users",
          localField: "extractedUserId",
          foreignField: "_id",
          as: "userInfo",
        },
      },

      // ---------------------------------------------------
      // Bước 5: Lấy tên khách
      // ---------------------------------------------------
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          lastTime: 1,
          sender: 1,

          senderName: {
            $cond: {
              if: {
                $gt: [
                  {
                    $size: "$userInfo",
                  },
                  0,
                ],
              },

              then: {
                // users của m đang dùng field "name"
                $ifNull: [
                  {
                    $arrayElemAt: ["$userInfo.name", 0],
                  },
                  {
                    $arrayElemAt: ["$userInfo.email", 0],
                  },
                ],
              },

              else: "Khách vãng lai",
            },
          },
        },
      },

      // ---------------------------------------------------
      // Bước 6: Phòng có tin nhắn mới nhất lên đầu
      // ---------------------------------------------------
      {
        $sort: {
          lastTime: -1,
        },
      },
    ]);

    res.status(200).json(rooms);
  } catch (error) {
    console.error("Lỗi lấy danh sách phòng chat:", error);

    res.status(500).json({
      message: "Lỗi lấy danh sách phòng chat",
      error: error.message,
    });
  }
};

// =========================================================
// 2. LẤY LỊCH SỬ TIN NHẮN
// =========================================================
exports.getChatHistory = async (req, res) => {
  try {
    const { roomId } = req.params;

    const history = await ChatMessage.find({
      roomId,
    }).sort({
      createdAt: 1,
    });

    res.status(200).json(history);
  } catch (error) {
    console.error("Lỗi lấy lịch sử tin nhắn:", error);

    res.status(500).json({
      message: "Lỗi lấy lịch sử tin nhắn",
      error: error.message,
    });
  }
};