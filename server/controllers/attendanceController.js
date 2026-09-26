const Attendance = require("../models/Attendance");


// ================================
// CẤU HÌNH VỊ TRÍ QUÁN
// ================================

// TODO: thay bằng tọa độ thật của quán
const RESTAURANT_LAT = 15.975479675865323;
const RESTAURANT_LNG = 108.25442895323303;

// Cho phép chấm công trong bán kính 100m
const MAX_DISTANCE = 300000;

// Mã QR cố định
const ATTENDANCE_QR_CODE = "LAUGA3VI_ATTENDANCE_2026";


// ================================
// TÍNH KHOẢNG CÁCH GPS
// ================================

const calculateDistance = (
  lat1,
  lon1,
  lat2,
  lon2
) => {
  const R = 6371000;

  const toRad = (value) => {
    return (value * Math.PI) / 180;
  };

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};


// ================================
// CHECK-IN
// ================================

const checkIn = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    const {
      qrCode,
      latitude,
      longitude,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Không xác định được nhân viên.",
      });
    }

    if (!qrCode) {
      return res.status(400).json({
        message: "Thiếu mã QR.",
      });
    }

    if (qrCode !== ATTENDANCE_QR_CODE) {
      return res.status(400).json({
        message: "Mã QR không hợp lệ.",
      });
    }

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return res.status(400).json({
        message: "Không lấy được vị trí GPS.",
      });
    }

    const distance = calculateDistance(
      latitude,
      longitude,
      RESTAURANT_LAT,
      RESTAURANT_LNG
    );

    // Ngoài phạm vi
    if (distance > MAX_DISTANCE) {
      return res.status(400).json({
        message: `Bạn đang cách quán khoảng ${Math.round(
          distance
        )}m. Không thể chấm công ngoài khu vực.`,
        distance: Math.round(distance),
      });
    }

    const now = new Date();

    // YYYY-MM-DD
    const date = now.toLocaleDateString("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    });

    // Kiểm tra đã check-in chưa
    let attendance = await Attendance.findOne({
      userId,
      date,
    });

    if (attendance?.checkIn?.time) {
      return res.status(400).json({
        message: "Bạn đã check-in hôm nay rồi.",
        attendance,
      });
    }

    if (!attendance) {
      attendance = new Attendance({
        userId,
        date,
      });
    }

    attendance.checkIn = {
      time: now,
      latitude,
      longitude,
      distance: Math.round(distance),
    };

    attendance.status = "working";

    await attendance.save();

    return res.status(200).json({
      message: "Check-in thành công!",
      attendance,
      distance: Math.round(distance),
    });
  } catch (error) {
    console.error("CHECK IN ERROR:", error);

    return res.status(500).json({
      message: "Lỗi server khi check-in.",
    });
  }
};


// ================================
// CHECK-OUT
// ================================

const checkOut = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    const {
      qrCode,
      latitude,
      longitude,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Không xác định được nhân viên.",
      });
    }

    if (qrCode !== ATTENDANCE_QR_CODE) {
      return res.status(400).json({
        message: "Mã QR không hợp lệ.",
      });
    }

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return res.status(400).json({
        message: "Không lấy được vị trí GPS.",
      });
    }

    const distance = calculateDistance(
      latitude,
      longitude,
      RESTAURANT_LAT,
      RESTAURANT_LNG
    );

    if (distance > MAX_DISTANCE) {
      return res.status(400).json({
        message: `Bạn đang cách quán khoảng ${Math.round(
          distance
        )}m. Không thể checkout ngoài khu vực.`,
        distance: Math.round(distance),
      });
    }

    const now = new Date();

    const date = now.toLocaleDateString("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    });

    const attendance = await Attendance.findOne({
      userId,
      date,
    });

    if (!attendance) {
      return res.status(400).json({
        message: "Bạn chưa check-in hôm nay.",
      });
    }

    if (!attendance.checkIn?.time) {
      return res.status(400).json({
        message: "Bạn chưa check-in.",
      });
    }

    if (attendance.checkOut?.time) {
      return res.status(400).json({
        message: "Bạn đã check-out hôm nay rồi.",
        attendance,
      });
    }

    attendance.checkOut = {
      time: now,
      latitude,
      longitude,
      distance: Math.round(distance),
    };

    attendance.status = "completed";

    await attendance.save();

    return res.status(200).json({
      message: "Check-out thành công!",
      attendance,
      distance: Math.round(distance),
    });
  } catch (error) {
    console.error("CHECK OUT ERROR:", error);

    return res.status(500).json({
      message: "Lỗi server khi check-out.",
    });
  }
};


// ================================
// LẤY CHẤM CÔNG CỦA NHÂN VIÊN
// ================================

const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    const attendance = await Attendance.find({
      userId,
    })
      .sort({
        date: -1,
      })
      .limit(50);

    return res.json({
      data: attendance,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Không thể lấy lịch sử chấm công.",
    });
  }
};


// ================================
// ADMIN - TẤT CẢ CHẤM CÔNG
// ================================

const getAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate("userId", "name email")
      .sort({
        date: -1,
        "checkIn.time": -1,
      });

    return res.json({
      data: attendance,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Không thể lấy dữ liệu chấm công.",
    });
  }
};


module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
};