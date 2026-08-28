const Category = require('../models/Category');

// [GET] /api/categories - Lấy tất cả danh mục
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
  }
};

// [POST] /api/categories - Tạo danh mục mới
exports.createCategory = async (req, res) => {
  try {
    const { name, description, image, isActive } = req.body;
    
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ success: false, message: 'Danh mục này đã tồn tại!' });
    }

    const newCategory = await Category.create({ name, description, image, isActive });
    res.status(201).json({ success: true, message: 'Thêm danh mục thành công', data: newCategory });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', error: error.message });
  }
};

// [PUT] /api/categories/:id - Cập nhật danh mục
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }

    res.status(200).json({ success: true, message: 'Cập nhật danh mục thành công', data: category });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Cập nhật thất bại', error: error.message });
  }
};

// [DELETE] /api/categories/:id - Xóa danh mục
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }
    res.status(200).json({ success: true, message: 'Đã xóa danh mục thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};