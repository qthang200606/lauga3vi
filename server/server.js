const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reservationRoutes = require("./routes/reservationRoutes");

const app = express();

// ====================
// Middleware
// ====================
app.use(cors({
  // Thay thế bằng link Vercel chính thức của bạn (bỏ dấu gạch chéo / ở cuối link nếu có)
  origin: [
    "https://lauga3vi.vercel.app", 
    "https://your-app-name.vercel.app", 
    "http://localhost:5173", // Giữ lại để test PC local
    "http://localhost:3000"
  ],
  credentials: true
}));
app.use(express.json());

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
// Routes
// ====================
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reservations", reservationRoutes);

// ====================
// Server
// ====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server đang chạy tại port ${PORT}`);
});