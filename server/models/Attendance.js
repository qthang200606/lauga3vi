const mongoose = require("mongoose");

const adjustmentHistorySchema = new mongoose.Schema(
  {
    oldCheckIn: {
      type: Date,
      default: null,
    },
    oldCheckOut: {
      type: Date,
      default: null,
    },
    newCheckIn: {
      type: Date,
      default: null,
    },
    newCheckOut: {
      type: Date,
      default: null,
    },
    note: {
      type: String,
      required: true,
      trim: true,
    },
    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adjustedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Ca làm được phân cho nhân viên
    employeeShiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeShift",
      default: null,
    },

    // Ngày làm theo múi giờ Việt Nam: YYYY-MM-DD
    date: {
      type: String,
      required: true,
      index: true,
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

    // Tiến trình chấm công của nhân viên
    status: {
      type: String,
      enum: ["working", "completed"],
      default: "working",
      index: true,
    },

    // Trạng thái duyệt của admin
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
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

    // Lý do chỉnh giờ hoặc từ chối
    adjustmentNote: {
      type: String,
      default: "",
      trim: true,
    },

    // Lịch sử chỉnh sửa giờ để đối chiếu
    adjustmentHistory: {
      type: [adjustmentHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Một ca được phân chỉ có một bản ghi chấm công.
// Các bản ghi cũ không có employeeShiftId vẫn được giữ lại.
attendanceSchema.index(
  { employeeShiftId: 1 },
  {
    unique: true,
    sparse: true,
  }
);

// Tối ưu truy vấn lịch sử của nhân viên
attendanceSchema.index({
  userId: 1,
  date: -1,
});

// Tối ưu truy vấn chấm công theo trạng thái duyệt
attendanceSchema.index({
  approvalStatus: 1,
  status: 1,
  date: -1,
});

module.exports = mongoose.model("Attendance", attendanceSchema);