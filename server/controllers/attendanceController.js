const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const EmployeeShift = require("../models/EmployeeShift");

// Tọa độ quán
const RESTAURANT_LAT = 15.975479675865323;
const RESTAURANT_LNG = 108.25442895323303;

// Bán kính cho phép: 100 mét
const MAX_DISTANCE = 300000;

const ATTENDANCE_QR_CODE = "LAUGA3VI_ATTENDANCE_2026";

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toRad = (value) => (value * Math.PI) / 180;

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

const getVietnamDate = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

const validateLocation = (latitude, longitude) => {
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return {
      valid: false,
      message: "Không lấy được vị trí GPS.",
    };
  }

  const distance = calculateDistance(
    latitude,
    longitude,
    RESTAURANT_LAT,
    RESTAURANT_LNG
  );

  if (distance > MAX_DISTANCE) {
    return {
      valid: false,
      distance: Math.round(distance),
      message: `Bạn đang cách quán khoảng ${Math.round(
        distance
      )}m. Không thể chấm công ngoài khu vực.`,
    };
  }

  return {
    valid: true,
    distance: Math.round(distance),
  };
};

// Kiểm tra ca được phân có thuộc nhân viên đang đăng nhập không
const getValidEmployeeShift = async (employeeShiftId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(employeeShiftId)) {
    return {
      error: "Ca làm không hợp lệ.",
      status: 400,
    };
  }

  const employeeShift = await EmployeeShift.findOne({
    _id: employeeShiftId,
    employee: userId,
  }).populate("workShift");

  if (!employeeShift) {
    return {
      error: "Không tìm thấy ca được phân cho tài khoản này.",
      status: 404,
    };
  }

  if (employeeShift.status === "cancelled") {
    return {
      error: "Ca làm này đã bị hủy.",
      status: 400,
    };
  }

  if (!employeeShift.workShift) {
    return {
      error: "Không tìm thấy thông tin mẫu ca.",
      status: 404,
    };
  }

  if (!employeeShift.workShift.isActive) {
    return {
      error: "Mẫu ca này hiện không còn hoạt động.",
      status: 400,
    };
  }

  if (employeeShift.workDate !== getVietnamDate()) {
    return {
      error: "Chỉ có thể chấm công cho ca được phân trong hôm nay.",
      status: 400,
    };
  }

  return { employeeShift };
};

// CHECK-IN
const checkIn = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { qrCode, latitude, longitude, employeeShiftId } = req.body;

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

    const shiftResult = await getValidEmployeeShift(
      employeeShiftId,
      userId
    );

    if (shiftResult.error) {
      return res.status(shiftResult.status).json({
        message: shiftResult.error,
      });
    }

    const gps = validateLocation(latitude, longitude);

    if (!gps.valid) {
      return res.status(400).json({
        message: gps.message,
        distance: gps.distance,
      });
    }

    const employeeShift = shiftResult.employeeShift;

    let attendance = await Attendance.findOne({
      employeeShiftId: employeeShift._id,
    });

    if (attendance?.checkIn?.time) {
      return res.status(400).json({
        message: "Bạn đã check-in ca này rồi.",
        attendance,
      });
    }

    if (!attendance) {
      attendance = new Attendance({
        userId,
        employeeShiftId: employeeShift._id,
        date: employeeShift.workDate,
      });
    }

    attendance.checkIn = {
      time: new Date(),
      latitude,
      longitude,
      distance: gps.distance,
    };

    attendance.status = "working";

    await attendance.save();

    return res.status(200).json({
      message: "Check-in thành công!",
      attendance,
      distance: gps.distance,
    });
  } catch (error) {
    console.error("CHECK IN ERROR:", error);

    return res.status(500).json({
      message: "Lỗi server khi check-in.",
    });
  }
};

// CHECK-OUT
const checkOut = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { qrCode, latitude, longitude, employeeShiftId } = req.body;

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

    const shiftResult = await getValidEmployeeShift(
      employeeShiftId,
      userId
    );

    if (shiftResult.error) {
      return res.status(shiftResult.status).json({
        message: shiftResult.error,
      });
    }

    const gps = validateLocation(latitude, longitude);

    if (!gps.valid) {
      return res.status(400).json({
        message: gps.message,
        distance: gps.distance,
      });
    }

    const employeeShift = shiftResult.employeeShift;

    const attendance = await Attendance.findOne({
      userId,
      employeeShiftId: employeeShift._id,
    });

    if (!attendance?.checkIn?.time) {
      return res.status(400).json({
        message: "Bạn chưa check-in ca này.",
      });
    }

    if (attendance.checkOut?.time) {
      return res.status(400).json({
        message: "Bạn đã check-out ca này rồi.",
        attendance,
      });
    }

    attendance.checkOut = {
      time: new Date(),
      latitude,
      longitude,
      distance: gps.distance,
    };

    attendance.status = "completed";

    await attendance.save();

    // Đánh dấu ca đã hoàn thành
    employeeShift.status = "completed";
    await employeeShift.save();

    return res.status(200).json({
      message: "Check-out thành công!",
      attendance,
      distance: gps.distance,
    });
  } catch (error) {
    console.error("CHECK OUT ERROR:", error);

    return res.status(500).json({
      message: "Lỗi server khi check-out.",
    });
  }
};

// LỊCH SỬ CHẤM CÔNG CỦA NHÂN VIÊN
const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Không xác định được nhân viên.",
      });
    }

    const attendance = await Attendance.find({ userId })
      .populate({
        path: "employeeShiftId",
        populate: {
          path: "workShift",
          select: "name startTime endTime breakMinutes",
        },
      })
      .sort({ date: -1, "checkIn.time": -1 })
      .limit(100);

    return res.json({
      data: attendance,
    });
  } catch (error) {
    console.error("GET MY ATTENDANCE ERROR:", error);

    return res.status(500).json({
      message: "Không thể lấy lịch sử chấm công.",
    });
  }
};

// ADMIN - TẤT CẢ CHẤM CÔNG
const getAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate("userId", "name email")
      .populate({
        path: "employeeShiftId",
        populate: {
          path: "workShift",
          select: "name startTime endTime breakMinutes",
        },
      })
      .sort({ date: -1, "checkIn.time": -1 });

    return res.json({
      data: attendance,
    });
  } catch (error) {
    console.error("GET ALL ATTENDANCE ERROR:", error);

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