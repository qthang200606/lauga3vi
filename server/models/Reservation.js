const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    // 🌟 THÊM FIELD NÀY ĐỂ LIÊN KẾT VỚI USER
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Tên model User trong backend của bạn
      required: false, // Để false nếu cho phép khách không đăng nhập vẫn đặt bàn được
    },
    reservationCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    guests: { type: Number, required: true, min: 1 },
    bookingDate: { type: String, required: true }, // Dạng YYYY-MM-DD
    bookingTime: { type: String, required: true }, // Dạng HH:mm
    tableNumber: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "checked_in", "completed", "cancelled"],
      default: "pending",
    },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reservation", reservationSchema);