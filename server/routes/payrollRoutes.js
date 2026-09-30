
const express = require("express");
const router = express.Router();

const {
  getMonthlyPayroll,
  getEmployeePayroll,
  getMyPayroll,
} = require("../controllers/payrollController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

router.use(protect);

// Nhân viên xem bảng lương của chính mình
router.get("/my", getMyPayroll);

// Các API bên dưới chỉ dành cho admin
router.use(adminOnly);

// GET /api/payroll?month=2026-09
router.get("/", getMonthlyPayroll);

// GET /api/payroll/employee/:employeeId?month=2026-09
router.get("/employee/:employeeId", getEmployeePayroll);

module.exports = router;