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
const chatRoutes = require("./routes/chatRoutes"); // <--- Import Route Chat
const ChatMessage = require("./models/ChatMessage");

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
    const { roomId, sender, senderName, message, time } = data;

    try {
      // 1. Lưu tin nhắn vào MongoDB
      const newMsg = new ChatMessage({ roomId,
         sender,
         senderName: senderName || (sender === "admin" ? "Quản lý" : "Khách vãng lai"),
          message, time });
      await newMsg.save();

      // 2. Phát tin nhắn đến tất cả client trong room đó
      io.to(roomId).emit("receive_message", newMsg);

      // 3. Bắn thông báo cho Admin nếu là khách gửi
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
app.use("/api/chat", chatRoutes); // <--- Đã đăng ký route Chat đầy đủ

// ====================
// Server Start
// ====================
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server đang chạy tại port ${PORT}`);
});