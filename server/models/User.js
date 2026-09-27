const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["customer", "employee", "admin"],
      default: "customer",
    },

    // Tài khoản có đang được phép đăng nhập không
    isActive: {
      type: Boolean,
      default: true,
    },

    googleId: {
      type: String,
      default: null,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // =====================================================
    // FACE VERIFICATION
    // =====================================================

    faceVerification: {
      enrolled: {
        type: Boolean,
        default: false,
      },

      provider: {
        type: String,
        enum: ["aws_rekognition"],
        default: "aws_rekognition",
      },

      // User ID của employee trong Rekognition Collection
      rekognitionUserId: {
        type: String,
        default: null,
      },

      // Danh sách FaceId được AWS lưu trong Collection
      faceIds: {
        type: [String],
        default: [],
      },

      enrolledAt: {
        type: Date,
        default: null,
      },

      lastVerifiedAt: {
        type: Date,
        default: null,
      },

      updatedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);