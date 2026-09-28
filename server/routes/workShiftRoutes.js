
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

router.use(protect);
router.use(adminOnly);

// Ca mẫu
router.get("/", getWorkShifts);
router.post("/", createWorkShift);
router.put("/:id", updateWorkShift);
router.patch("/:id/status", updateWorkShiftStatus);

// Lịch phân công nhân viên
router.get("/assignments", getEmployeeShifts);
router.post("/assignments", createEmployeeShift);
router.put("/assignments/:id", updateEmployeeShift);
router.delete("/assignments/:id", cancelEmployeeShift);

module.exports = router;
