const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Ca làm được phân cho nhân viên
    employeeShiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeShift",
      default: null,
    },

    // Ngày làm YYYY-MM-DD
    date: {
      type: String,
      required: true,
    },

    checkIn: {
      time: {
        type: Date,
        default: null,
      },
      latitude: {
        type: Number,
        default: null,
      },
      longitude: {
        type: Number,
        default: null,
      },
      distance: {
        type: Number,
        default: null,
      },
    },

    approvalStatus: {
  type: String,
  enum: ["pending", "approved"],
  default: "pending",
  index: true,
},

reviewedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},

reviewedAt: {
  type: Date,
  default: null,
},

adjustmentNote: {
  type: String,
  default: "",
  trim: true,
},

    checkOut: {
      time: {
        type: Date,
        default: null,
      },
      latitude: {
        type: Number,
        default: null,
      },
      longitude: {
        type: Number,
        default: null,
      },
      distance: {
        type: Number,
        default: null,
      },
    },

    status: {
      type: String,
      enum: ["working", "completed"],
      default: "working",
    },
  },
  {
    timestamps: true,
  }
  
);

// Một ca được phân chỉ có một bản ghi chấm công.
// sparse giúp các bản ghi cũ chưa có employeeShiftId vẫn tồn tại.
attendanceSchema.index(
  { employeeShiftId: 1 },
  {
    unique: true,
    sparse: true,
  }
);

// Giữ truy vấn lịch sử của nhân viên nhanh hơn.
attendanceSchema.index({
  userId: 1,
  date: -1,
});

module.exports = mongoose.model("Attendance", attendanceSchema);