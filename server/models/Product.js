const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Vui lòng nhập tên món"],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", // Liên kết với Model Category
      required: [true, "Món ăn bắt buộc phải thuộc một danh mục"],
    },
    price: {
      type: Number,
      required: [true, "Vui lòng nhập giá"],
      min: 0,
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    isAvailable: {
      type: Boolean,
      default: true, // Còn hàng / Hết hàng
    },
    isBestSeller: {
      type: Boolean,
      default: false, // Món bán chạy
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);