const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  sender: { type: String, required: true },
  senderName: { type: String, default: "Khách vãng lai" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // <--- THÊM DÒNG NÀY
  message: { type: String, required: true },
  time: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);