const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

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

attendanceSchema.index(
  {
    userId: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Attendance", attendanceSchema);