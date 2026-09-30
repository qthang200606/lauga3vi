const express = require("express");
const router = express.Router();

const {
  getMonthlyPayroll,
  getEmployeePayroll,
} = require("../controllers/payrollController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// Tất cả API bảng lương chỉ dành cho admin
router.use(protect);
router.use(adminOnly);

// GET /api/payroll?month=2026-09
router.get("/", getMonthlyPayroll);

// GET /api/payroll/employee/:employeeId?month=2026-09
router.get("/employee/:employeeId", getEmployeePayroll);

module.exports = router;