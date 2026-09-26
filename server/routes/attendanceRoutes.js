const express = require("express");

const {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
} = require("../controllers/attendanceController");

const {
  protect,
  adminOnly,
  employeeOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();


// =========================================================
// NHÂN VIÊN
// =========================================================

router.post(
  "/check-in",
  protect,
  employeeOnly,
  checkIn
);

router.post(
  "/check-out",
  protect,
  employeeOnly,
  checkOut
);

router.get(
  "/my",
  protect,
  employeeOnly,
  getMyAttendance
);


// =========================================================
// ADMIN
// =========================================================

router.get(
  "/admin/all",
  protect,
  adminOnly,
  getAllAttendance
);


module.exports = router;