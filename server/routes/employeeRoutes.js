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

module.exports = router;