const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    sender: { type: String, enum: ["client", "admin"], required: true },
    message: { type: String, required: true },
    time: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatMessage", chatMessageSchema);