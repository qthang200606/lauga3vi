const express = require("express");
const router = express.Router();

const {
  getEmployees,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
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

// Tất cả API trong router đều yêu cầu quyền admin
router.use(protect);
router.use(adminOnly);

// =====================================================
// EMPLOYEE
// =====================================================

// Lấy danh sách nhân viên
router.get("/", getEmployees);

// Tạo nhân viên
router.post("/", createEmployee);

// Cập nhật thông tin nhân viên
router.put("/:id", updateEmployee);

// Khóa / mở khóa nhân viên
router.patch("/:id/status", updateEmployeeStatus);

// Đổi mật khẩu nhân viên
router.put(
  "/:id/password",
  changeEmployeePassword
);

// Xóa nhân viên
router.delete("/:id", deleteEmployee);

// =====================================================
// FACE ID
// =====================================================

// Đăng ký Face ID (chỉ khi nhân viên chưa có)
router.post(
  "/:id/face/enroll",
  completeFaceEnrollment
);

// Kiểm tra trạng thái Face ID
router.get(
  "/:id/face",
  getFaceStatus
);

// Xóa Face ID
router.delete(
  "/:id/face",
  deleteFace
);

module.exports = router;