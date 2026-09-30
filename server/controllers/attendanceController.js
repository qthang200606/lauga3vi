const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const EmployeeShift = require("../models/EmployeeShift");

// ========================================
// CẤU HÌNH CHẤM CÔNG
// ========================================

// Tọa độ quán
const RESTAURANT_LAT = 15.975479675865323;
const RESTAURANT_LNG = 108.25442895323303;

// Bán kính cho phép chấm công: 100 mét
const MAX_DISTANCE = 30000;

// Mã QR chấm công hiện tại
const ATTENDANCE_QR_CODE = "LAUGA3VI_ATTENDANCE_2026";

// ========================================
// HÀM HỖ TRỢ
// ========================================

// Tính khoảng cách GPS, đơn vị mét
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

// Lấy ngày hiện tại theo múi giờ Việt Nam
const getVietnamDate = (date = new Date()) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

// Kiểm tra GPS
const validateLocation = (latitude, longitude) => {
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return {
      valid: false,
      message: "Không lấy được vị trí GPS hợp lệ.",
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
      )}m. Không thể chấm công ngoài khu vực cho phép.`,
    };
  }

  return {
    valid: true,
    distance: Math.round(distance),
  };
};

// Lấy ID người dùng từ middleware xác thực
const getCurrentUserId = (req) => {
  return req.user?.id || req.user?._id;
};

// Kiểm tra ID MongoDB
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Kiểm tra và lấy ca được phân cho nhân viên
const getValidEmployeeShift = async (employeeShiftId, userId) => {
  if (!isValidObjectId(employeeShiftId)) {
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

// Chuẩn hóa bản ghi trả về cho admin
const populateAttendance = (query) => {
  return query
    .populate("userId", "name email phone position")
    .populate("reviewedBy", "name email")
    .populate({
      path: "adjustmentHistory.adjustedBy",
      select: "name email",
    })
    .populate({
      path: "employeeShiftId",
      populate: {
        path: "workShift",
        select: "name startTime endTime breakMinutes",
      },
    });
};

// ========================================
// NHÂN VIÊN: CHECK-IN
// ========================================

const checkIn = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const {
      qrCode,
      latitude,
      longitude,
      employeeShiftId,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được nhân viên.",
      });
    }

    if (qrCode !== ATTENDANCE_QR_CODE) {
      return res.status(400).json({
        success: false,
        message: "Mã QR không hợp lệ.",
      });
    }

    const shiftResult = await getValidEmployeeShift(
      employeeShiftId,
      userId
    );

    if (shiftResult.error) {
      return res.status(shiftResult.status).json({
        success: false,
        message: shiftResult.error,
      });
    }

    const gps = validateLocation(latitude, longitude);

    if (!gps.valid) {
      return res.status(400).json({
        success: false,
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
        success: false,
        message: "Bạn đã check-in ca này rồi.",
        data: attendance,
      });
    }

    if (!attendance) {
      attendance = new Attendance({
        userId,
        employeeShiftId: employeeShift._id,
        date: employeeShift.workDate,
        status: "working",
        approvalStatus: "pending",
      });
    }

    attendance.checkIn = {
      time: new Date(),
      latitude,
      longitude,
      distance: gps.distance,
    };

    attendance.checkOut = {
      time: null,
      latitude: null,
      longitude: null,
      distance: null,
    };

    attendance.status = "working";
    attendance.approvalStatus = "pending";
    attendance.reviewedBy = null;
    attendance.reviewedAt = null;

    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Check-in thành công!",
      data: attendance,
      distance: gps.distance,
    });
  } catch (error) {
    console.error("CHECK IN ERROR:", error);

    // Có thể xảy ra khi hai yêu cầu check-in cùng lúc
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Ca này đã có bản ghi chấm công.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi check-in.",
    });
  }
};

// ========================================
// NHÂN VIÊN: CHECK-OUT
// ========================================

const checkOut = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const {
      qrCode,
      latitude,
      longitude,
      employeeShiftId,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được nhân viên.",
      });
    }

    if (qrCode !== ATTENDANCE_QR_CODE) {
      return res.status(400).json({
        success: false,
        message: "Mã QR không hợp lệ.",
      });
    }

    const shiftResult = await getValidEmployeeShift(
      employeeShiftId,
      userId
    );

    if (shiftResult.error) {
      return res.status(shiftResult.status).json({
        success: false,
        message: shiftResult.error,
      });
    }

    const gps = validateLocation(latitude, longitude);

    if (!gps.valid) {
      return res.status(400).json({
        success: false,
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
        success: false,
        message: "Bạn chưa check-in ca này.",
      });
    }

    if (attendance.checkOut?.time) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã check-out ca này rồi.",
        data: attendance,
      });
    }

    const checkOutTime = new Date();

    if (checkOutTime <= new Date(attendance.checkIn.time)) {
      return res.status(400).json({
        success: false,
        message: "Thời gian check-out không hợp lệ.",
      });
    }

    attendance.checkOut = {
      time: checkOutTime,
      latitude,
      longitude,
      distance: gps.distance,
    };

    // Đã check-out nhưng chưa được admin duyệt
    attendance.status = "completed";
    attendance.approvalStatus = "pending";
    attendance.reviewedBy = null;
    attendance.reviewedAt = null;

    await attendance.save();

    // Đánh dấu ca đã hoàn thành ở bảng phân ca
    employeeShift.status = "completed";
    await employeeShift.save();

    return res.status(200).json({
      success: true,
      message: "Check-out thành công! Ca làm đang chờ admin duyệt.",
      data: attendance,
      distance: gps.distance,
    });
  } catch (error) {
    console.error("CHECK OUT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi check-out.",
    });
  }
};

// ========================================
// NHÂN VIÊN: LỊCH SỬ CHẤM CÔNG CỦA MÌNH
// ========================================

const getMyAttendance = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
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
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error("GET MY ATTENDANCE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể lấy lịch sử chấm công.",
    });
  }
};

// ========================================
// ADMIN: LẤY TOÀN BỘ CHẤM CÔNG
// ========================================

const getAllAttendance = async (req, res) => {
  try {
    const attendance = await populateAttendance(
      Attendance.find()
    )
      .sort({ date: -1, "checkIn.time": -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error("GET ALL ATTENDANCE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể lấy dữ liệu chấm công.",
    });
  }
};

// ========================================
// ADMIN: CHỈNH GIỜ CHẤM CÔNG
// ========================================

const adjustAttendance = async (req, res) => {
  try {
    const adminId = getCurrentUserId(req);
    const { id } = req.params;
    const { checkInTime, checkOutTime, note } = req.body;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được tài khoản quản trị.",
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID chấm công không hợp lệ.",
      });
    }

    if (
      !checkInTime ||
      !checkOutTime ||
      !String(note || "").trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Vui lòng nhập đủ giờ check-in, check-out và lý do chỉnh sửa.",
      });
    }

    const newCheckIn = new Date(checkInTime);
    const newCheckOut = new Date(checkOutTime);

    if (
      Number.isNaN(newCheckIn.getTime()) ||
      Number.isNaN(newCheckOut.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Thời gian không hợp lệ.",
      });
    }

    if (newCheckOut <= newCheckIn) {
      return res.status(400).json({
        success: false,
        message: "Giờ check-out phải sau giờ check-in.",
      });
    }

    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản ghi chấm công.",
      });
    }

    if (attendance.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể chỉnh giờ khi nhân viên đã check-out.",
      });
    }

    const oldCheckIn = attendance.checkIn?.time || null;
    const oldCheckOut = attendance.checkOut?.time || null;

    attendance.adjustmentHistory.push({
      oldCheckIn,
      oldCheckOut,
      newCheckIn,
      newCheckOut,
      note: String(note).trim(),
      adjustedBy: adminId,
      adjustedAt: new Date(),
    });

    // Chỉ cập nhật thời gian, giữ nguyên dữ liệu GPS
    attendance.checkIn.time = newCheckIn;
    attendance.checkOut.time = newCheckOut;

    attendance.adjustmentNote = String(note).trim();

    // Chỉnh giờ thì bắt buộc duyệt lại
    attendance.approvalStatus = "pending";
    attendance.reviewedBy = null;
    attendance.reviewedAt = null;

    await attendance.save();

    const updatedAttendance = await populateAttendance(
      Attendance.findById(attendance._id)
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Đã chỉnh giờ. Bản ghi đang chờ duyệt lại.",
      data: updatedAttendance,
    });
  } catch (error) {
    console.error("ADJUST ATTENDANCE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể chỉnh sửa giờ chấm công.",
    });
  }
};

// ========================================
// ADMIN: DUYỆT CHẤM CÔNG
// ========================================

const approveAttendance = async (req, res) => {
  try {
    const adminId = getCurrentUserId(req);
    const { id } = req.params;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được tài khoản quản trị.",
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID chấm công không hợp lệ.",
      });
    }

    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản ghi chấm công.",
      });
    }

    if (attendance.status !== "completed") {
      return res.status(400).json({
        success: false,
        message:
          "Chỉ có thể duyệt ca đã check-out.",
      });
    }

    if (attendance.approvalStatus === "approved") {
      return res.status(400).json({
        success: false,
        message: "Bản ghi này đã được duyệt trước đó.",
      });
    }

    if (
      !attendance.checkIn?.time ||
      !attendance.checkOut?.time
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Bản ghi chưa có đủ giờ check-in và check-out.",
      });
    }

    const checkInTime = new Date(attendance.checkIn.time);
    const checkOutTime = new Date(attendance.checkOut.time);

    if (
      Number.isNaN(checkInTime.getTime()) ||
      Number.isNaN(checkOutTime.getTime()) ||
      checkOutTime <= checkInTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Khoảng thời gian chấm công không hợp lệ.",
      });
    }

    attendance.approvalStatus = "approved";
    attendance.reviewedBy = adminId;
    attendance.reviewedAt = new Date();

    await attendance.save();

    const updatedAttendance = await populateAttendance(
      Attendance.findById(attendance._id)
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Duyệt chấm công thành công.",
      data: updatedAttendance,
    });
  } catch (error) {
    console.error("APPROVE ATTENDANCE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể duyệt chấm công.",
    });
  }
};

// ========================================
// ADMIN: TỪ CHỐI CHẤM CÔNG
// ========================================

const rejectAttendance = async (req, res) => {
  try {
    const adminId = getCurrentUserId(req);
    const { id } = req.params;
    const { note } = req.body;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được tài khoản quản trị.",
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID chấm công không hợp lệ.",
      });
    }

    if (!String(note || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập lý do từ chối.",
      });
    }

    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản ghi chấm công.",
      });
    }

    if (attendance.status !== "completed") {
      return res.status(400).json({
        success: false,
        message:
          "Chỉ có thể từ chối bản ghi đã check-out.",
      });
    }

    if (attendance.approvalStatus === "approved") {
      return res.status(400).json({
        success: false,
        message:
          "Bản ghi đã duyệt. Hãy chỉnh sửa giờ và duyệt lại nếu cần thay đổi.",
      });
    }

    attendance.approvalStatus = "rejected";
    attendance.adjustmentNote = String(note).trim();
    attendance.reviewedBy = adminId;
    attendance.reviewedAt = new Date();

    await attendance.save();

    const updatedAttendance = await populateAttendance(
      Attendance.findById(attendance._id)
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Đã từ chối bản ghi chấm công.",
      data: updatedAttendance,
    });
  } catch (error) {
    console.error("REJECT ATTENDANCE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể từ chối chấm công.",
    });
  }
};

// ========================================
// EXPORT
// ========================================

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  adjustAttendance,
  approveAttendance,
  rejectAttendance,
};