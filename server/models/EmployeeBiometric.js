const mongoose = require("mongoose");

const employeeBiometricSchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
      },

      provider: {
        type: String,
        default: "face-api",
      },

      descriptor: {
        type: [Number],
        required: true,
        validate: {
          validator: (value) =>
            Array.isArray(value) &&
            value.length === 128,

          message:
            "Face descriptor phải có 128 giá trị.",
        },
      },

      enrolledAt: {
        type: Date,
        default: Date.now,
      },

      lastVerifiedAt: {
        type: Date,
        default: null,
      },

      // ==========================================
      // TRẠNG THÁI FACE ID
      // ==========================================

      enrollmentVersion: {
        type: Number,
        default: 1,
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

module.exports =
  mongoose.model(
    "EmployeeBiometric",
    employeeBiometricSchema
  );