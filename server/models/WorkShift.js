
const mongoose = require("mongoose");

const workShiftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên ca làm là bắt buộc"],
      trim: true,
    },

    startTime: {
      type: String,
      required: [true, "Giờ bắt đầu là bắt buộc"],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Giờ bắt đầu không hợp lệ"],
    },

    endTime: {
      type: String,
      required: [true, "Giờ kết thúc là bắt buộc"],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Giờ kết thúc không hợp lệ"],
    },

    breakMinutes: {
      type: Number,
      default: 0,
      min: [0, "Thời gian nghỉ không được âm"],
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WorkShift", workShiftSchema);
