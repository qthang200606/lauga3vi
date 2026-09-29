const express = require("express");
const router = express.Router();

const {
  getWorkShifts,
  createWorkShift,
  updateWorkShift,
  updateWorkShiftStatus,
  getEmployeeShifts,
  createEmployeeShift,
  updateEmployeeShift,
  cancelEmployeeShift,
} = require("../controllers/workShiftController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

// Tất cả API trong file đều yêu cầu đăng nhập
router.use(protect);

// ================================
// CA MẪU
// ================================

// Nhân viên và admin đều có thể xem danh sách ca đang hoạt động
router.get("/", getWorkShifts);

// Chỉ admin được quản lý ca mẫu
router.post("/", adminOnly, createWorkShift);
router.put("/:id", adminOnly, updateWorkShift);
router.patch("/:id/status", adminOnly, updateWorkShiftStatus);

// ================================
// LỊCH PHÂN CÔNG NHÂN VIÊN
// ================================

// Nhân viên xem lịch của mình; admin xem và lọc lịch nhân viên
// Controller getEmployeeShifts phải tự giới hạn dữ liệu theo req.user
router.get("/assignments", getEmployeeShifts);

// Chỉ admin được phân công, sửa và hủy ca
router.post("/assignments", adminOnly, createEmployeeShift);
router.put(
  "/assignments/:id",
  adminOnly,
  updateEmployeeShift
);
router.delete(
  "/assignments/:id",
  adminOnly,
  cancelEmployeeShift
);

module.exports = router;