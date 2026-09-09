const express = require("express");

const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getOrders,
  updateOrder,
  updateOrderStatus,
} = require("../controllers/orderController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

// ======================================================
// KHÁCH QUÉT QR TẠI BÀN
// KHÔNG CẦN ĐĂNG NHẬP
// ======================================================

router.post("/", createOrder);

// ======================================================
// KHÁCH ĐÃ ĐĂNG NHẬP
// ======================================================

router.get(
  "/my-orders",
  protect,
  getMyOrders
);

// ======================================================
// ADMIN - LẤY TẤT CẢ ĐƠN
// ======================================================

router.get(
  "/",
  protect,
  adminOnly,
  getOrders
);

// ======================================================
// ADMIN - CẬP NHẬT CHI TIẾT ĐƠN HÀNG
// ======================================================
// Dùng cho POS:
// - Thêm món
// - Xóa món
// - Sửa số lượng
// - Sửa ghi chú
// - Cập nhật tổng tiền
// ======================================================

router.put(
  "/:id",
  protect,
  adminOnly,
  updateOrder
);

// ======================================================
// ADMIN - CẬP NHẬT TRẠNG THÁI
// ======================================================

router.put(
  "/:id/status",
  protect,
  adminOnly,
  updateOrderStatus
);

module.exports = router;