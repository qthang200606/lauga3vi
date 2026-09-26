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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);