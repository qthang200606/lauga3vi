const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER
    // Khách quét QR có thể không đăng nhập
    // ==========================================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },

    // ==========================================
    // LOẠI ĐƠN
    // Dine-in = ăn tại quán
    // Takeaway = mang về
    // ==========================================
    orderType: {
      type: String,
      enum: ["Dine-in", "Takeaway"],
      default: "Takeaway",
    },

    // ==========================================
    // MÃ BÀN
    // Ví dụ: B01, B02, B03
    // ==========================================
    tableCode: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // DANH SÁCH MÓN
    // ==========================================
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: false,
        },

        name: {
          type: String,
          required: true,
        },

        price: {
          type: Number,
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
      },
    ],

    // ==========================================
    // THÔNG TIN KHÁCH
    // Đơn tại bàn có thể không cần
    // ==========================================
    shippingInfo: {
      fullName: {
        type: String,
        default: "",
      },

      phone: {
        type: String,
        default: "",
      },

      address: {
        type: String,
        default: "",
      },

      note: {
        type: String,
        default: "",
      },
    },

    // ==========================================
    // PHƯƠNG THỨC THANH TOÁN
    // ==========================================
    paymentMethod: {
      type: String,
      default: "COD",
    },

    // ==========================================
    // TỔNG TIỀN
    // ==========================================
    totalPrice: {
      type: Number,
      required: true,
    },

    // ==========================================
    // TRẠNG THÁI ĐƠN
    // ==========================================
    status: {
      type: String,
      default: "Pending",
    },

    // ==========================================
    // ĐÃ THANH TOÁN CHƯA
    // ==========================================
    isPaid: {
      type: Boolean,
      default: false,
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);