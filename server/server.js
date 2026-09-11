const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const sepayRoutes = require("./routes/sepayRoutes");
const chatRoutes = require("./routes/chatRoutes");

const ChatMessage = require("./models/ChatMessage");
const User = require("./models/User"); // <--- Import thêm Model User

const app = express();
const server = http.createServer(app);

// ====================
// Cấu hình Socket.io
// ====================
const io = new Server(server, {
  cors: {
    origin: [
      "https://lauga3vi.vercel.app",
      "https://your-app-name.vercel.app",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  },
});

// ====================
// Middleware
// ====================
app.use(
  cors({
    origin: [
      "https://lauga3vi.vercel.app",
      "https://your-app-name.vercel.app",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====================
// Kết nối MongoDB
// ====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB: Kết nối thành công!");
  })
  .catch((err) => {
    console.error("MongoDB lỗi kết nối:", err);
  });

// ====================
// Socket.io Realtime Chat Engine
// ====================
io.on("connection", (socket) => {
  console.log("⚡ Người dùng kết nối Socket:", socket.id);

  // Tham gia phòng chat
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`📌 Socket ${socket.id} đã vào phòng: ${roomId}`);
  });

  // Nhận và Phát tin nhắn Realtime + Lưu DB
  socket.on("send_message", async (data) => {
    const { roomId, sender, senderName, userId, message, time } = data;

    try {
      let finalSenderName = senderName;

      // Nếu là khách gửi, ưu tiên tìm tên thật từ DB User qua userId hoặc roomId
      if (sender === "client") {
        let dbUser = null;

        if (userId) {
          dbUser = await User.findById(userId);
        } else if (roomId && roomId.startsWith("user_")) {
          // Tự bóc tách ID nếu roomId có dạng user_6a78a54fa19178f4d61869f1
          const extractedId = roomId.replace("user_", "");
          if (mongoose.Types.ObjectId.isValid(extractedId)) {
            dbUser = await User.findById(extractedId);
          }
        }

        if (dbUser && dbUser.name) {
          finalSenderName = dbUser.name; // Lấy đúng tên "Ngô Quang Thắng" trong MongoDB
        } else {
          finalSenderName = senderName || "Khách vãng lai";
        }
      } else {
        finalSenderName = "Quản lý";
      }

      // 1. Lưu tin nhắn vào MongoDB
      const newMsg = new ChatMessage({
        roomId,
        sender,
        senderName: finalSenderName,
        message,
        time,
      });
      await newMsg.save();

      // 2. Nếu lấy được tên thật từ DB, tự đồng bộ lại tên cho toàn bộ tin nhắn cũ của room này
      if (sender === "client" && finalSenderName !== "Khách vãng lai") {
        await ChatMessage.updateMany(
          { roomId },
          { $set: { senderName: finalSenderName } }
        );
      }

      // 3. Phát tin nhắn đến tất cả client trong room đó
      io.to(roomId).emit("receive_message", newMsg);

      // 4. Bắn thông báo cho Admin nếu là khách gửi
      if (sender === "client") {
        io.emit("admin_notification", { roomId, lastMessage: message });
      }
    } catch (err) {
      console.error("Lỗi lưu tin nhắn:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Ngắt kết nối Socket:", socket.id);
  });
});

// ====================
// Routes
// ====================
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/sepay", sepayRoutes);
app.use("/api/chat", chatRoutes);

// ====================
// Server Start
// ====================
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server đang chạy tại port ${PORT}`);
});