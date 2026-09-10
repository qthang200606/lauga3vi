const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER
    // ==========================================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },

    // ==========================================
    // LOẠI ĐƠN
    // ==========================================
    orderType: {
      type: String,
      enum: ["Dine-in", "Takeaway"],
      default: "Takeaway",
    },

    // ==========================================
    // MÃ BÀN
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

        note: {
          type: String,
          default: "",
          trim: true,
        },

        image: {
          type: String,
          default: "",
        },
      },
    ],

    // ==========================================
    // THÔNG TIN KHÁCH
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

      customerName: {
        type: String,
        default: "",
      },

      customerPhone: {
        type: String,
        default: "",
      },
    },

    // ==========================================
    // GHI CHÚ ĐƠN
    // ==========================================
    note: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // THANH TOÁN
    // ==========================================
   paymentMethod: {
  type: String,
  default: "COD",
},

paymentStatus: {
  type: String,
  default: "UNPAID",
},

paymentCode: {
  type: String,
  unique: true,
  sparse: true,
  trim: true,
},

paidAmount: {
  type: Number,
  default: 0,
},

paymentTransactionId: {
  type: String,
  default: "",
  trim: true,
},

paymentGateway: {
  type: String,
  default: "",
  trim: true,
},

paidAt: {
  type: Date,
  default: null,
},

totalPrice: {
  type: Number,
  required: true,
},

    // ==========================================
    // TRẠNG THÁI
    // ==========================================
    status: {
      type: String,
      default: "pending",
    },

    // ==========================================
    // ĐÃ THANH TOÁN
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