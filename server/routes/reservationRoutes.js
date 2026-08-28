const express = require("express");
const router = express.Router();

const {
  getReservations,
  createReservation,
  updateReservationStatus,
  getMyReservations,
} = require("../controllers/reservationController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// Route Đặt bàn (Yêu cầu đăng nhập để đính kèm user ID)
router.post("/", protect, createReservation);

// Route lấy lịch sử của chính User
router.get("/my-reservations", protect, getMyReservations);

// Route cho Admin
router.get("/", protect, adminOnly, getReservations);
router.patch("/:id/status", protect, adminOnly, updateReservationStatus);

module.exports = router;