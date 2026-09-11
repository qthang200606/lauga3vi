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
const User = require("./models/User");

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

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`📌 Socket ${socket.id} đã vào phòng: ${roomId}`);
  });

socket.on("send_message", async (data) => {
  const { roomId, sender, senderName, userId, message, time } = data;

  try {
    let finalSenderName = "Khách vãng lai";
    let validUserId = userId;

    if (sender === "client") {
      // 1. Nếu thiếu userId thì tự cắt ra từ roomId (user_6a784382c8f1989918019215)
      if (!validUserId && roomId && roomId.startsWith("user_")) {
        validUserId = roomId.replace("user_", "").trim();
      }

      // 2. ÉP SERVER MÓC BẢNG USERS LẤY TÊN THẬT
      if (validUserId && mongoose.Types.ObjectId.isValid(validUserId)) {
        const dbUser = await User.findById(validUserId);
        if (dbUser && dbUser.name) {
          finalSenderName = dbUser.name; // <--- Sẽ lấy được "Ngô Quang Thắng"
        } else if (senderName && senderName !== "Khách vãng lai") {
          finalSenderName = senderName;
        }
      }
    } else {
      finalSenderName = "Quản lý";
    }

    // 3. Lưu vào DB với tên chuẩn
    const newMsg = new ChatMessage({
      roomId,
      sender,
      senderName: finalSenderName,
      userId: validUserId && mongoose.Types.ObjectId.isValid(validUserId) ? validUserId : null,
      message,
      time,
    });
    await newMsg.save();

    // 4. ĐỔI LUÔN TÊN CHO TOÀN BỘ TIN NHẮN CŨ TRONG ROOM NÀY
    if (sender === "client" && finalSenderName !== "Khách vãng lai") {
      await ChatMessage.updateMany(
        { roomId },
        { $set: { senderName: finalSenderName } }
      );
    }

    io.to(roomId).emit("receive_message", newMsg);
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