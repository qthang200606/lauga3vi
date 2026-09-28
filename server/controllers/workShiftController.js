
const mongoose = require("mongoose");
const WorkShift = require("../models/WorkShift");
const EmployeeShift = require("../models/EmployeeShift");
const User = require("../models/User");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const isValidDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value;
};

const timeToMinutes = (time) => {
  if (typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return null;
  }

  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const dateToDayNumber = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
};

const getShiftInterval = (workDate, shift) => {
  const start = timeToMinutes(shift.startTime);
  const end = timeToMinutes(shift.endTime);

  if (start === null || end === null || start === end) {
    return null;
  }

  const dayStart = dateToDayNumber(workDate) * 1440;
  const startAt = dayStart + start;
  const endAt = dayStart + end + (end <= start ? 1440 : 0);

  return { startAt, endAt };
};

const intervalsOverlap = (a, b) => {
  return a.startAt < b.endAt && b.startAt < a.endAt;
};

const validateShiftBody = (body) => {
  const { name, startTime, endTime, breakMinutes } = body;

  if (!name || !String(name).trim()) {
    return "Vui lòng nhập tên ca làm.";
  }

  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  if (start === null || end === null) {
    return "Giờ bắt đầu hoặc giờ kết thúc không hợp lệ (HH:mm).";
  }

  if (start === end) {
    return "Giờ bắt đầu và kết thúc không được giống nhau.";
  }

  if (
    breakMinutes !== undefined &&
    (!Number.isFinite(Number(breakMinutes)) || Number(breakMinutes) < 0)
  ) {
    return "Thời gian nghỉ không hợp lệ.";
  }

  return null;
};

// =====================================================
// CA MẪU
// =====================================================

// GET /api/work-shifts
exports.getWorkShifts = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const query = includeInactive === "true" ? {} : { isActive: true };

    const shifts = await WorkShift.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      shifts,
    });
  } catch (error) {
    console.error("getWorkShifts:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách ca làm.",
    });
  }
};

// POST /api/work-shifts
exports.createWorkShift = async (req, res) => {
  try {
    const validationError = validateShiftBody(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const { name, startTime, endTime, breakMinutes, description } = req.body;

    const shift = await WorkShift.create({
      name: String(name).trim(),
      startTime,
      endTime,
      breakMinutes: Number(breakMinutes) || 0,
      description: description || "",
    });

    return res.status(201).json({
      success: true,
      message: "Tạo ca làm thành công.",
      shift,
    });
  } catch (error) {
    console.error("createWorkShift:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể tạo ca làm.",
    });
  }
};

// PUT /api/work-shifts/:id
exports.updateWorkShift = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID ca làm không hợp lệ.",
      });
    }

    const validationError = validateShiftBody(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const { name, startTime, endTime, breakMinutes, description } = req.body;

    const shift = await WorkShift.findByIdAndUpdate(
      id,
      {
        name: String(name).trim(),
        startTime,
        endTime,
        breakMinutes: Number(breakMinutes) || 0,
        description: description || "",
      },
      { new: true, runValidators: true }
    );

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ca làm.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật ca làm thành công.",
      shift,
    });
  } catch (error) {
    console.error("updateWorkShift:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật ca làm.",
    });
  }
};

// PATCH /api/work-shifts/:id/status
exports.updateWorkShiftStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID ca làm không hợp lệ.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive phải là true hoặc false.",
      });
    }

    const shift = await WorkShift.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ca làm.",
      });
    }

    return res.status(200).json({
      success: true,
      message: isActive ? "Đã mở lại ca làm." : "Đã ngừng ca làm.",
      shift,
    });
  } catch (error) {
    console.error("updateWorkShiftStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật trạng thái ca.",
    });
  }
};

// =====================================================
// LỊCH PHÂN CÔNG NHÂN VIÊN
// =====================================================

// GET /api/work-shifts/assignments?date=YYYY-MM-DD
// Hoặc ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
exports.getEmployeeShifts = async (req, res) => {
  try {
    const { date, startDate, endDate, employeeId, status } = req.query;

    const query = {};

    if (date) {
      if (!isValidDate(date)) {
        return res.status(400).json({
          success: false,
          message: "Ngày lọc không hợp lệ.",
        });
      }
      query.workDate = date;
    } else if (startDate || endDate) {
      if (
        (startDate && !isValidDate(startDate)) ||
        (endDate && !isValidDate(endDate)) ||
        (startDate && endDate && startDate > endDate)
      ) {
        return res.status(400).json({
          success: false,
          message: "Khoảng ngày lọc không hợp lệ.",
        });
      }

      query.workDate = {};
      if (startDate) query.workDate.$gte = startDate;
      if (endDate) query.workDate.$lte = endDate;
    }

    if (employeeId) {
      if (!isValidId(employeeId)) {
        return res.status(400).json({
          success: false,
          message: "ID nhân viên không hợp lệ.",
        });
      }
      query.employee = employeeId;
    }

    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: "cancelled" };
    }

    const assignments = await EmployeeShift.find(query)
      .populate("employee", "name email phone position department isActive")
      .populate("workShift", "name startTime endTime breakMinutes description")
      .populate("assignedBy", "name")
      .sort({ workDate: 1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error("getEmployeeShifts:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể lấy lịch phân công.",
    });
  }
};

// Kiểm tra nhân viên đã có ca bị giao nhau chưa.
// Kiểm tra cả ngày trước và ngày sau để xử lý ca qua đêm.
const findOverlappingAssignment = async ({
  employeeId,
  workDate,
  shift,
  excludeAssignmentId = null,
}) => {
  const candidateInterval = getShiftInterval(workDate, shift);
  if (!candidateInterval) return null;

  const dayNumber = dateToDayNumber(workDate);
  const previousDate = new Date((dayNumber - 1) * 86400000)
    .toISOString()
    .slice(0, 10);
  const nextDate = new Date((dayNumber + 1) * 86400000)
    .toISOString()
    .slice(0, 10);

  const query = {
    employee: employeeId,
    workDate: { $in: [previousDate, workDate, nextDate] },
    status: { $ne: "cancelled" },
  };

  if (excludeAssignmentId) {
    query._id = { $ne: excludeAssignmentId };
  }

  const existingAssignments = await EmployeeShift.find(query)
    .populate("workShift");

  return existingAssignments.find((assignment) => {
    if (!assignment.workShift) return false;

    const existingInterval = getShiftInterval(
      assignment.workDate,
      assignment.workShift
    );

    return existingInterval &&
      intervalsOverlap(candidateInterval, existingInterval);
  }) || null;
};

// POST /api/work-shifts/assignments
exports.createEmployeeShift = async (req, res) => {
  try {
    const { employeeId, workShiftId, workDate, note } = req.body;

    if (!isValidId(employeeId) || !isValidId(workShiftId)) {
      return res.status(400).json({
        success: false,
        message: "ID nhân viên hoặc ca làm không hợp lệ.",
      });
    }

    if (!isValidDate(workDate)) {
      return res.status(400).json({
        success: false,
        message: "Ngày làm không hợp lệ. Định dạng yêu cầu YYYY-MM-DD.",
      });
    }

    const employee = await User.findOne({
      _id: employeeId,
      role: "employee",
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên.",
      });
    }

    if (!employee.isActive) {
      return res.status(400).json({
        success: false,
        message: "Nhân viên đang bị khóa, không thể xếp ca.",
      });
    }

    const workShift = await WorkShift.findOne({
      _id: workShiftId,
      isActive: true,
    });

    if (!workShift) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ca làm đang hoạt động.",
      });
    }

    const duplicate = await EmployeeShift.findOne({
      employee: employeeId,
      workShift: workShiftId,
      workDate,
      status: { $ne: "cancelled" },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Nhân viên đã được xếp vào ca này trong ngày.",
      });
    }

    const overlap = await findOverlappingAssignment({
      employeeId,
      workDate,
      shift: workShift,
    });

    if (overlap) {
      return res.status(409).json({
        success: false,
        message: `Nhân viên đã có ca "${overlap.workShift.name}" bị trùng giờ trong ngày ${overlap.workDate}.`,
        conflictingAssignmentId: overlap._id,
      });
    }

    const assignment = await EmployeeShift.create({
      employee: employeeId,
      workShift: workShiftId,
      workDate,
      note: note || "",
      assignedBy: req.user?._id || req.user?.id || null,
    });

    await assignment.populate([
      { path: "employee", select: "name email phone position department" },
      { path: "workShift", select: "name startTime endTime breakMinutes" },
      { path: "assignedBy", select: "name" },
    ]);

    return res.status(201).json({
      success: true,
      message: "Phân công ca làm thành công.",
      assignment,
    });
  } catch (error) {
    console.error("createEmployeeShift:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Phân công này đã tồn tại.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Không thể phân công ca làm.",
    });
  }
};

// PUT /api/work-shifts/assignments/:id
exports.updateEmployeeShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, workShiftId, workDate, note, status } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID phân công không hợp lệ.",
      });
    }

    const assignment = await EmployeeShift.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch phân công.",
      });
    }

    const nextEmployeeId = employeeId || assignment.employee.toString();
    const nextWorkShiftId = workShiftId || assignment.workShift.toString();
    const nextWorkDate = workDate || assignment.workDate;

    if (!isValidId(nextEmployeeId) || !isValidId(nextWorkShiftId)) {
      return res.status(400).json({
        success: false,
        message: "ID nhân viên hoặc ca làm không hợp lệ.",
      });
    }

    if (!isValidDate(nextWorkDate)) {
      return res.status(400).json({
        success: false,
        message: "Ngày làm không hợp lệ.",
      });
    }

    const allowedStatuses = [
      "scheduled",
      "confirmed",
      "cancelled",
      "completed",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái phân công không hợp lệ.",
      });
    }

    const employee = await User.findOne({
      _id: nextEmployeeId,
      role: "employee",
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên.",
      });
    }

    if (!employee.isActive) {
      return res.status(400).json({
        success: false,
        message: "Nhân viên đang bị khóa, không thể xếp ca.",
      });
    }

    const workShift = await WorkShift.findById(nextWorkShiftId);

    if (!workShift) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ca làm.",
      });
    }

    const nextStatus = status || assignment.status;

    if (nextStatus !== "cancelled") {
      if (!workShift.isActive) {
        return res.status(400).json({
          success: false,
          message: "Ca làm đã ngừng hoạt động.",
        });
      }

      const overlap = await findOverlappingAssignment({
        employeeId: nextEmployeeId,
        workDate: nextWorkDate,
        shift: workShift,
        excludeAssignmentId: id,
      });

      if (overlap) {
        return res.status(409).json({
          success: false,
          message: `Nhân viên đã có ca "${overlap.workShift.name}" bị trùng giờ trong ngày ${overlap.workDate}.`,
          conflictingAssignmentId: overlap._id,
        });
      }
    }

    assignment.employee = nextEmployeeId;
    assignment.workShift = nextWorkShiftId;
    assignment.workDate = nextWorkDate;
    assignment.status = nextStatus;

    if (note !== undefined) {
      assignment.note = note;
    }

    await assignment.save();

    await assignment.populate([
      { path: "employee", select: "name email phone position department" },
      { path: "workShift", select: "name startTime endTime breakMinutes" },
      { path: "assignedBy", select: "name" },
    ]);

    return res.status(200).json({
      success: true,
      message: "Cập nhật lịch phân công thành công.",
      assignment,
    });
  } catch (error) {
    console.error("updateEmployeeShift:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật lịch phân công.",
    });
  }
};

// DELETE /api/work-shifts/assignments/:id
// Hủy mềm để vẫn giữ lịch sử phân công
exports.cancelEmployeeShift = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID phân công không hợp lệ.",
      });
    }

    const assignment = await EmployeeShift.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch phân công.",
      });
    }

    if (assignment.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Không thể hủy ca đã hoàn thành.",
      });
    }

    assignment.status = "cancelled";
    await assignment.save();

    return res.status(200).json({
      success: true,
      message: "Đã hủy phân công ca làm.",
      assignment,
    });
  } catch (error) {
    console.error("cancelEmployeeShift:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể hủy phân công.",
    });
  }
};
