const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http"); // <--- Import thêm http
const { Server } = require("socket.io"); // <--- Import thêm Socket.io
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const sepayRoutes = require("./routes/sepayRoutes");
const ChatMessage = require("./models/ChatMessage"); // <--- Import Model Chat

const app = express();
const server = http.createServer(app); // <--- Bọc Express app bằng HTTP server

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
// API Lấy Lịch Sử Chat
// ====================
app.get("/api/chat/history/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const history = await ChatMessage.find({ roomId }).sort({ createdAt: 1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy lịch sử tin nhắn", error });
  }
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
    const { roomId, sender, message, time } = data;

    try {
      // 1. Lưu tin nhắn vào MongoDB
      const newMsg = new ChatMessage({ roomId, sender, message, time });
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

// ====================
// Server Start (Lưu ý dùng server.listen thay vì app.listen)
// ====================
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server đang chạy tại port ${PORT}`);
});