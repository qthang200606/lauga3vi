const express = require("express");

const router = express.Router();

const {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  changeEmployeePassword,
} = require("../controllers/employeeController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  changeEmployeePassword,

  createFaceEnrollmentSession,
  completeFaceEnrollment,
  getFaceStatus,
  deleteFace,
} = require("../controllers/employeeController");

// Tất cả API nhân viên chỉ Admin
router.use(protect);
router.use(adminOnly);

router.get("/", getEmployees);

router.post("/", createEmployee);

router.put("/:id", updateEmployee);

router.delete("/:id", deleteEmployee);

router.put(
  "/:id/password",
  changeEmployeePassword
);

router.post(
  "/:id/face/session",
  createFaceEnrollmentSession
);

router.post(
  "/:id/face/enroll",
  completeFaceEnrollment
);

router.get(
  "/:id/face",
  getFaceStatus
);

router.delete(
  "/:id/face",
  deleteFace
);

module.exports = router;