const Product = require("../models/Product");

// [GET] /api/products - Lấy danh sách sản phẩm (Hỗ trợ lọc theo danh mục)
exports.getProducts = async (req, res) => {
  try {
    const { categoryId } = req.query;
    let filter = {};

    if (categoryId) {
      filter.category = categoryId;
    }

    // Populate để lấy thông tin tên danh mục liên kết
    const products = await Product.find(filter)
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
};

// [POST] /api/products - Tạo món ăn mới
exports.createProduct = async (req, res) => {
  try {
    const { name, category, price, description, image, isAvailable, isBestSeller } = req.body;

    const newProduct = await Product.create({
      name,
      category,
      price,
      description,
      image,
      isAvailable,
      isBestSeller,
    });

    // Populate thông tin danh mục ngay sau khi tạo
    const populatedProduct = await Product.findById(newProduct._id).populate("category", "name");

    res.status(201).json({ success: true, message: "Thêm món thành công", data: populatedProduct });
  } catch (error) {
    res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ", error: error.message });
  }
};

// [PUT] /api/products/:id - Cập nhật món ăn
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("category", "name");

    if (!product) {
      return res.status(404).json({ success: false, message: "Không tìm thấy món ăn" });
    }

    res.status(200).json({ success: true, message: "Cập nhật thành công", data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: "Cập nhật thất bại", error: error.message });
  }
};

// [DELETE] /api/products/:id - Xóa món ăn
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Không tìm thấy món ăn" });
    }
    res.status(200).json({ success: true, message: "Xóa món ăn thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};