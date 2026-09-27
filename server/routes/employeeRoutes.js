const express = require("express");

const router = express.Router();

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

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

router.use(protect);
router.use(adminOnly);

router.get("/", getEmployees);

router.post("/", createEmployee);

router.put("/:id", updateEmployee);

router.put("/:id/password", changeEmployeePassword);

router.delete("/:id", deleteEmployee);

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