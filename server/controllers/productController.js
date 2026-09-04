const Product = require("../models/Product");

// ===============================
// GET /api/products
// ===============================
exports.getProducts = async (req, res) => {
  try {
    const { categoryId } = req.query;

    const filter = {};

    if (categoryId) {
      filter.category = categoryId;
    }

    const products = await Product.find(filter)
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Lỗi Get Products:", error);

    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message,
    });
  }
};

// ===============================
// POST /api/products
// ===============================
exports.createProduct = async (req, res) => {
  try {
    console.log("========== CREATE PRODUCT ==========");
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    // Tránh lỗi destructure khi req.body undefined
    const body = req.body || {};

    const {
      name,
      category,
      price,
      description,
      isAvailable,
      isBestSeller,
    } = body;

    // Kiểm tra dữ liệu bắt buộc
    if (!name || !category || price === undefined || price === "") {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin món ăn",
        error: {
          name: !name,
          category: !category,
          price: price === undefined || price === "",
        },
      });
    }

    // Nếu có upload ảnh -> lấy URL Cloudinary
    // Nếu không upload ảnh -> lấy image cũ từ body
    const image = req.file
      ? req.file.path
      : body.image || "";

    const newProduct = await Product.create({
      name: name.trim(),
      category,
      price: Number(price),
      description: description || "",
      image,

      isAvailable:
        isAvailable === "true" ||
        isAvailable === true,

      isBestSeller:
        isBestSeller === "true" ||
        isBestSeller === true,
    });

    const populatedProduct =
      await Product.findById(newProduct._id)
        .populate("category", "name");

    console.log("Tạo món thành công:", populatedProduct);

    res.status(201).json({
      success: true,
      message: "Thêm món thành công",
      data: populatedProduct,
    });

  } catch (error) {
    console.error("Lỗi Create Product:", error);

    res.status(400).json({
      success: false,
      message: "Dữ liệu không hợp lệ",
      error: error.message,
    });
  }
};

// ===============================
// PUT /api/products/:id
// ===============================
exports.updateProduct = async (req, res) => {
  try {
    console.log("========== UPDATE PRODUCT ==========");
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const body = req.body || {};

    const updateData = {
      ...body,
    };

    if (body.price !== undefined && body.price !== "") {
      updateData.price = Number(body.price);
    }

    if (body.isAvailable !== undefined) {
      updateData.isAvailable =
        body.isAvailable === "true" ||
        body.isAvailable === true;
    }

    if (body.isBestSeller !== undefined) {
      updateData.isBestSeller =
        body.isBestSeller === "true" ||
        body.isBestSeller === true;
    }

    // Có ảnh mới
    if (req.file) {
      updateData.image = req.file.path;
    }

    const product =
      await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      ).populate("category", "name");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy món ăn",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật thành công",
      data: product,
    });

  } catch (error) {
    console.error("Lỗi Update Product:", error);

    res.status(400).json({
      success: false,
      message: "Cập nhật thất bại",
      error: error.message,
    });
  }
};

// ===============================
// DELETE /api/products/:id
// ===============================
exports.deleteProduct = async (req, res) => {
  try {
    const product =
      await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy món ăn",
      });
    }

    res.status(200).json({
      success: true,
      message: "Xóa món ăn thành công",
    });

  } catch (error) {
    console.error("Lỗi Delete Product:", error);

    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message,
    });
  }
};