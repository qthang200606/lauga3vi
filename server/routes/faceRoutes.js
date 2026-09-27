const express = require("express");

const {
  getMyFaceStatus,
  getEmployeeFaceStatus,
  enrollFace,
  verifyFace,
  deleteFace,
} = require("../controllers/faceController");

const {
  protect,
  adminOnly,
  employeeOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// EMPLOYEE
// ==========================================

// Nhân viên kiểm tra mình đã đăng ký face chưa
router.get(
  "/my",
  protect,
  employeeOnly,
  getMyFaceStatus
);

// Nhân viên xác thực khuôn mặt
router.post(
  "/verify",
  protect,
  employeeOnly,
  verifyFace
);

// ==========================================
// ADMIN
// ==========================================

// Admin xem trạng thái face của nhân viên
router.get(
  "/employee/:employeeId",
  protect,
  adminOnly,
  getEmployeeFaceStatus
);

// Admin đăng ký / đăng ký lại face
router.post(
  "/employee/:employeeId/enroll",
  protect,
  adminOnly,
  enrollFace
);

// Admin xóa face
router.delete(
  "/employee/:employeeId",
  protect,
  adminOnly,
  deleteFace
);

module.exports = router;