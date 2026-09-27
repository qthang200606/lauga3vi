const express = require("express");

const router = express.Router();

const {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  changeEmployeePassword,
  completeFaceEnrollment,
  getFaceStatus,
  deleteFace,
} = require("../controllers/employeeController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

router.use(protect);
router.use(adminOnly);

// ==========================================
// EMPLOYEE
// ==========================================

router.get("/", getEmployees);

router.post("/", createEmployee);

router.put("/:id", updateEmployee);

router.put(
  "/:id/password",
  changeEmployeePassword
);

router.delete("/:id", deleteEmployee);

// ==========================================
// FACE
// ==========================================

// Đăng ký khuôn mặt
router.post(
  "/:id/face/enroll",
  completeFaceEnrollment
);

// Kiểm tra trạng thái khuôn mặt
router.get(
  "/:id/face",
  getFaceStatus
);

// Xóa khuôn mặt
router.delete(
  "/:id/face",
  deleteFace
);

module.exports = router;