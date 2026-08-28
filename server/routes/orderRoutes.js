const express = require("express");

const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getOrders,
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
// ADMIN
// ======================================================

router.get(
  "/",
  protect,
  adminOnly,
  getOrders
);

router.put(
  "/:id/status",
  protect,
  adminOnly,
  updateOrderStatus
);


module.exports = router;