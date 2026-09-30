const express = require("express");

const {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  adjustAttendance,
  approveAttendance,
  rejectAttendance,
} = require("../controllers/attendanceController");

const {
  protect,
  adminOnly,
  employeeOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ========================================
// NHÂN VIÊN
// ========================================

// Check-in
router.post(
  "/check-in",
  protect,
  employeeOnly,
  checkIn
);

// Check-out
router.post(
  "/check-out",
  protect,
  employeeOnly,
  checkOut
);

// Lịch sử chấm công của nhân viên đăng nhập
router.get(
  "/my",
  protect,
  employeeOnly,
  getMyAttendance
);

// ========================================
// ADMIN
// ========================================

// Lấy toàn bộ lịch sử chấm công
router.get(
  "/admin/all",
  protect,
  adminOnly,
  getAllAttendance
);

// Admin chỉnh giờ check-in / check-out
router.patch(
  "/admin/:id/adjust",
  protect,
  adminOnly,
  adjustAttendance
);

// Admin duyệt chấm công
router.patch(
  "/admin/:id/approve",
  protect,
  adminOnly,
  approveAttendance
);

// Admin từ chối chấm công
router.patch(
  "/admin/:id/reject",
  protect,
  adminOnly,
  rejectAttendance
);

module.exports = router;