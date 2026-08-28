const Reservation = require("../models/Reservation");

// 1. Tạo đơn đặt bàn mới (Gắn chặt userId của tài khoản đăng nhập)
const createReservation = async (req, res) => {
  try {
    const { customerName, phone, email, guests, bookingDate, bookingTime, note } = req.body;
    const reservationCode = "RES-" + Math.floor(1000 + Math.random() * 9000);

    // req.user được middleware protect giải mã từ Token
    const userId = req.user ? (req.user._id || req.user.id) : null;

    const newReservation = new Reservation({
      reservationCode,
      user: userId, // <-- Lưu ObjectId chuẩn của User vào MongoDB
      customerName,
      phone,
      email,
      guests,
      bookingDate,
      bookingTime,
      note,
    });

    await newReservation.save();
    res.status(201).json({ success: true, data: newReservation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 2. Lấy lịch sử CHỈ THEO USER ID ĐANG ĐĂNG NHẬP
const getMyReservations = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // Chuẩn chỉnh: Lọc đúng tài khoản này trong Database
    const reservations = await Reservation.find({ user: userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: reservations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy lịch sử đặt bàn",
      error: error.message,
    });
  }
};

// 3. Lấy danh sách cho Admin
const getReservations = async (req, res) => {
  try {
    const { date, status } = req.query;
    let query = {};

    if (date) {
      const formattedDate = new Date(date).toISOString().split("T")[0];
      query.bookingDate = formattedDate;
    }
    if (status && status !== "all") query.status = status;

    const reservations = await Reservation.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reservations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Admin cập nhật trạng thái/bàn
const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tableNumber } = req.body;

    const updateData = { status };
    if (tableNumber !== undefined) updateData.tableNumber = tableNumber;

    const updated = await Reservation.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Không tìm thấy lượt đặt bàn" });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createReservation,
  getMyReservations,
  getReservations,
  updateReservationStatus,
};