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
// KHÁCH QUÉT QR TẠI BÀN (KHÔNG CẦN ĐĂNG NHẬP)
// ======================================================

router.post("/", createOrder);

// ✅ Cho phép khách tại bàn gọi GET /api/orders mà không bị 403
router.get("/", getOrders); 

// ======================================================
// KHÁCH ĐÃ ĐĂNG NHẬP
// ======================================================

router.get(
  "/my-orders",
  protect,
  getMyOrders
);

// ======================================================
// ADMIN - CẬP NHẬT CHI TIẾT ĐƠN HÀNG & TRẠNG THÁI
// ======================================================

router.put(
  "/:id",
  protect,
  adminOnly,
  updateOrder
);

router.put(
  "/:id/status",
  protect,
  adminOnly,
  updateOrderStatus
);

module.exports = router;