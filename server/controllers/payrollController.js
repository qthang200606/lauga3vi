
const mongoose = require("mongoose");
const User = require("../models/User");
const Attendance = require("../models/Attendance");

// Lấy tháng hiện tại theo múi giờ Việt Nam
const getVietnamMonth = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  return `${year}-${month}`;
};

// Chuyển YYYY-MM thành khoảng ngày [đầu tháng, đầu tháng kế tiếp)
const getMonthRange = (month) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return null;
  }

  const [year, monthNumber] = month.split("-").map(Number);

  const startDate = `${year}-${String(monthNumber).padStart(2, "0")}-01`;

  const nextMonthDate = new Date(Date.UTC(year, monthNumber, 1));
  const endDate = [
    nextMonthDate.getUTCFullYear(),
    String(nextMonthDate.getUTCMonth() + 1).padStart(2, "0"),
    "01",
  ].join("-");

  return { startDate, endDate };
};

const roundMoney = (value) => Math.round(Number(value) || 0);

const formatHours = (minutes) =>
  Math.round((minutes / 60) * 100) / 100;

// Tính lương từ danh sách chấm công đã được duyệt
const calculateEmployeePayroll = (employee, attendances) => {
  const isDaily = employee.payType === "daily";
  const hourlyRate = Number(employee.hourlyRate) || 0;
  const dailyRate = Number(employee.dailyRate) || 0;

  let totalMinutes = 0;
  let totalSalary = 0;

  const countedDates = new Set();
  const attendanceDetails = [];

  attendances.forEach((attendance) => {
    const checkIn = attendance.checkIn?.time
      ? new Date(attendance.checkIn.time)
      : null;

    const checkOut = attendance.checkOut?.time
      ? new Date(attendance.checkOut.time)
      : null;

    if (
      !checkIn ||
      !checkOut ||
      Number.isNaN(checkIn.getTime()) ||
      Number.isNaN(checkOut.getTime()) ||
      checkOut <= checkIn
    ) {
      return;
    }

    const workedMinutes = Math.floor(
      (checkOut.getTime() - checkIn.getTime()) / 60000
    );

    if (workedMinutes <= 0) return;

    totalMinutes += workedMinutes;

    let salary = 0;

    if (isDaily) {
      // Lương ngày: một ngày có nhiều ca vẫn chỉ tính một lần
      if (!countedDates.has(attendance.date)) {
        countedDates.add(attendance.date);
        salary = roundMoney(dailyRate);
        totalSalary += salary;
      }
    } else {
      // Lương giờ: số phút làm việc / 60 * mức lương giờ
      salary = roundMoney((workedMinutes / 60) * hourlyRate);
      totalSalary += salary;
    }

    const workShift = attendance.employeeShiftId?.workShift;

    attendanceDetails.push({
      attendanceId: attendance._id,
      employeeShiftId: attendance.employeeShiftId?._id || null,
      shiftName: workShift?.name || "Ca làm",
      date: attendance.date,
      checkIn,
      checkOut,
      workedMinutes,
      workedHours: formatHours(workedMinutes),
      salary,
      approvalStatus: attendance.approvalStatus,
    });
  });

  return {
    employee: {
      _id: employee._id,
      name: employee.name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      position: employee.position || "",
      department: employee.department || "",
      isActive: employee.isActive,
      payType: employee.payType || "hourly",
    },
    salaryRate: isDaily ? dailyRate : hourlyRate,
    salaryUnit: isDaily ? "ngày" : "giờ",
    attendanceCount: attendanceDetails.length,
    totalDays: isDaily ? countedDates.size : 0,
    totalMinutes,
    totalHours: formatHours(totalMinutes),
    totalSalary: roundMoney(totalSalary),
    attendanceDetails,
  };
};

// Dùng chung truy vấn chấm công đã được duyệt
const getApprovedAttendances = (employeeId, range) => {
  return Attendance.find({
    userId: employeeId,
    date: {
      $gte: range.startDate,
      $lt: range.endDate,
    },
    status: "completed",
    approvalStatus: "approved",
    "checkIn.time": { $ne: null },
    "checkOut.time": { $ne: null },
  })
    .select(
      "userId employeeShiftId date checkIn checkOut status approvalStatus"
    )
    .populate({
      path: "employeeShiftId",
      populate: {
        path: "workShift",
        select: "name startTime endTime",
      },
    })
    .sort({ date: 1, "checkIn.time": 1 })
    .lean();
};

// GET /api/payroll?month=2026-09
// Admin xem bảng lương tất cả nhân viên
exports.getMonthlyPayroll = async (req, res) => {
  try {
    const month = String(req.query.month || getVietnamMonth()).trim();
    const range = getMonthRange(month);

    if (!range) {
      return res.status(400).json({
        success: false,
        message: "Tháng không hợp lệ. Định dạng đúng là YYYY-MM.",
      });
    }

    const employees = await User.find({ role: "employee" })
      .select(
        "name email phone position department isActive payType hourlyRate dailyRate"
      )
      .sort({ name: 1 })
      .lean();

    if (employees.length === 0) {
      return res.status(200).json({
        success: true,
        month,
        period: range,
        summary: {
          employeeCount: 0,
          attendanceCount: 0,
          pendingCount: 0,
          totalMinutes: 0,
          totalHours: 0,
          totalSalary: 0,
        },
        data: [],
      });
    }

    const employeeIds = employees.map((employee) => employee._id);

    const approvedAttendances = await Attendance.find({
      userId: { $in: employeeIds },
      date: {
        $gte: range.startDate,
        $lt: range.endDate,
      },
      status: "completed",
      approvalStatus: "approved",
      "checkIn.time": { $ne: null },
      "checkOut.time": { $ne: null },
    })
      .select(
        "userId employeeShiftId date checkIn checkOut status approvalStatus"
      )
      .populate({
        path: "employeeShiftId",
        populate: {
          path: "workShift",
          select: "name startTime endTime",
        },
      })
      .sort({ date: 1, "checkIn.time": 1 })
      .lean();

    // Số bản ghi chưa được duyệt trong tháng
    const pendingCount = await Attendance.countDocuments({
      userId: { $in: employeeIds },
      date: {
        $gte: range.startDate,
        $lt: range.endDate,
      },
      approvalStatus: { $ne: "approved" },
    });

    const employeeMap = new Map();

    employees.forEach((employee) => {
      employeeMap.set(String(employee._id), {
        employee,
        hourlyRate: Number(employee.hourlyRate) || 0,
        dailyRate: Number(employee.dailyRate) || 0,
        attendanceCount: 0,
        totalMinutes: 0,
        totalDays: 0,
        totalSalary: 0,
        attendanceDetails: [],
        countedDates: new Set(),
      });
    });

    approvedAttendances.forEach((attendance) => {
      const employeeKey = String(
        attendance.userId?._id || attendance.userId
      );
      const payroll = employeeMap.get(employeeKey);

      if (!payroll) return;

      const checkInTime = attendance.checkIn?.time
        ? new Date(attendance.checkIn.time)
        : null;

      const checkOutTime = attendance.checkOut?.time
        ? new Date(attendance.checkOut.time)
        : null;

      if (
        !checkInTime ||
        !checkOutTime ||
        Number.isNaN(checkInTime.getTime()) ||
        Number.isNaN(checkOutTime.getTime()) ||
        checkOutTime <= checkInTime
      ) {
        return;
      }

      const workedMinutes = Math.floor(
        (checkOutTime.getTime() - checkInTime.getTime()) / 60000
      );

      if (workedMinutes <= 0) return;

      payroll.attendanceCount += 1;
      payroll.totalMinutes += workedMinutes;

      let attendanceSalary = 0;

      if (payroll.employee.payType === "daily") {
        if (!payroll.countedDates.has(attendance.date)) {
          payroll.countedDates.add(attendance.date);
          payroll.totalDays += 1;

          attendanceSalary = roundMoney(payroll.dailyRate);
          payroll.totalSalary += attendanceSalary;
        }
      } else {
        attendanceSalary = roundMoney(
          (workedMinutes / 60) * payroll.hourlyRate
        );

        payroll.totalSalary += attendanceSalary;
      }

      const workShift = attendance.employeeShiftId?.workShift;

      payroll.attendanceDetails.push({
        attendanceId: attendance._id,
        employeeShiftId: attendance.employeeShiftId?._id || null,
        shiftName: workShift?.name || "Ca làm",
        date: attendance.date,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        workedMinutes,
        workedHours: formatHours(workedMinutes),
        salary: attendanceSalary,
        approvalStatus: attendance.approvalStatus,
      });
    });

    const data = Array.from(employeeMap.values()).map((payroll) => {
      const isDaily = payroll.employee.payType === "daily";

      return {
        _id: payroll.employee._id,
        name: payroll.employee.name || "",
        email: payroll.employee.email || "",
        phone: payroll.employee.phone || "",
        position: payroll.employee.position || "",
        department: payroll.employee.department || "",
        isActive: payroll.employee.isActive,
        payType: payroll.employee.payType || "hourly",
        hourlyRate: payroll.hourlyRate,
        dailyRate: payroll.dailyRate,
        salaryRate: isDaily ? payroll.dailyRate : payroll.hourlyRate,
        salaryUnit: isDaily ? "ngày" : "giờ",
        attendanceCount: payroll.attendanceCount,
        totalMinutes: payroll.totalMinutes,
        totalHours: formatHours(payroll.totalMinutes),
        totalDays: payroll.totalDays,
        totalSalary: roundMoney(payroll.totalSalary),
        attendanceDetails: payroll.attendanceDetails,
      };
    });

    const totalSalary = data.reduce(
      (sum, employee) => sum + employee.totalSalary,
      0
    );

    const totalMinutes = data.reduce(
      (sum, employee) => sum + employee.totalMinutes,
      0
    );

    const attendanceCount = data.reduce(
      (sum, employee) => sum + employee.attendanceCount,
      0
    );

    return res.status(200).json({
      success: true,
      month,
      period: range,
      summary: {
        employeeCount: employees.length,
        attendanceCount,
        pendingCount,
        totalMinutes,
        totalHours: formatHours(totalMinutes),
        totalSalary: roundMoney(totalSalary),
      },
      data,
    });
  } catch (error) {
    console.error("getMonthlyPayroll error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể tính bảng lương.",
    });
  }
};

// GET /api/payroll/employee/:employeeId?month=2026-09
// Admin xem chi tiết lương một nhân viên
exports.getEmployeePayroll = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const month = String(req.query.month || getVietnamMonth()).trim();

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "ID nhân viên không hợp lệ.",
      });
    }

    const range = getMonthRange(month);

    if (!range) {
      return res.status(400).json({
        success: false,
        message: "Tháng không hợp lệ. Định dạng đúng là YYYY-MM.",
      });
    }

    const employee = await User.findOne({
      _id: employeeId,
      role: "employee",
    })
      .select(
        "name email phone position department isActive payType hourlyRate dailyRate"
      )
      .lean();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên.",
      });
    }

    const attendances = await getApprovedAttendances(employee._id, range);
    const data = calculateEmployeePayroll(employee, attendances);

    return res.status(200).json({
      success: true,
      month,
      period: range,
      data,
    });
  } catch (error) {
    console.error("getEmployeePayroll error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể lấy chi tiết lương nhân viên.",
    });
  }
};

// GET /api/payroll/my?month=2026-09
// Nhân viên xem bảng lương của chính mình
exports.getMyPayroll = async (req, res) => {
  try {
    // ID được lấy từ tài khoản đã xác thực, không lấy từ client
    const employeeId = req.user?._id || req.user?.id;

    if (
      !employeeId ||
      !mongoose.Types.ObjectId.isValid(String(employeeId))
    ) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được tài khoản đăng nhập.",
      });
    }

    const employee = await User.findOne({
      _id: employeeId,
      role: "employee",
    })
      .select(
        "name email phone position department isActive payType hourlyRate dailyRate"
      )
      .lean();

    if (!employee) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản này không phải nhân viên.",
      });
    }

    const month = String(req.query.month || getVietnamMonth()).trim();
    const range = getMonthRange(month);

    if (!range) {
      return res.status(400).json({
        success: false,
        message: "Tháng không hợp lệ. Định dạng đúng là YYYY-MM.",
      });
    }

    const attendances = await getApprovedAttendances(employee._id, range);
    const data = calculateEmployeePayroll(employee, attendances);

    return res.status(200).json({
      success: true,
      month,
      period: range,
      data,
    });
  } catch (error) {
    console.error("getMyPayroll error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể lấy bảng lương của bạn.",
    });
  }
};