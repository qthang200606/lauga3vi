
const mongoose = require("mongoose");

const employeeShiftSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    workShift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkShift",
      required: true,
    },

    // Định dạng YYYY-MM-DD
    workDate: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Ngày làm không hợp lệ"],
    },

    status: {
      type: String,
      enum: ["scheduled", "confirmed", "cancelled", "completed"],
      default: "scheduled",
    },

    note: {
      type: String,
      trim: true,
      default: "",
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Không cho cùng nhân viên bị phân công trùng một ca trong cùng ngày
employeeShiftSchema.index({
  employee: 1,
  workDate: 1,
});

module.exports = mongoose.model("EmployeeShift", employeeShiftSchema);
