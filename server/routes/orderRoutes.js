const express = require("express");
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getOrders,
  updateOrder,
  updateOrderStatus,
  checkoutOrders,
} = require("../controllers/orderController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

// POS chốt thanh toán một nhóm đơn cụ thể
router.post("/checkout", protect, adminOnly, checkoutOrders);

// Khách quét QR tại bàn
router.post("/", createOrder);

// Danh sách đơn
router.get("/", getOrders);

// Đơn của tài khoản đăng nhập
router.get("/my-orders", protect, getMyOrders);

// Admin cập nhật đơn
router.put("/:id", protect, adminOnly, updateOrder);
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

module.exports = router;