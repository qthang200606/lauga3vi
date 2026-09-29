
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const EmployeeBiometric = require("../models/EmployeeBiometric");

const EMPLOYMENT_TYPES = [
  "Toàn thời gian",
  "Bán thời gian",
  "Thời vụ",
];

const PAY_TYPES = ["hourly", "daily"];

const EMPLOYEE_PROFILE_FIELDS = [
  "name",
  "email",
  "phone",
  "password",
  "isActive",
  "position",
  "department",
  "employmentType",
  "payType",
  "hourlyRate",
  "dailyRate",
  "startDate",
  "note",
];

const normalizeEmail = (email) =>
  String(email || "").trim().toLowerCase();

const isValidObjectId = (id) =>
  /^[a-f\d]{24}$/i.test(String(id || ""));

const pickEmployeeFields = (body = {}) => {
  const result = {};

  EMPLOYEE_PROFILE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      result[field] = body[field];
    }
  });

  return result;
};

const validateEmployeeProfile = (
  input,
  { isCreate = false } = {}
) => {
  const errors = [];
  const data = { ...input };

  if (isCreate || Object.prototype.hasOwnProperty.call(data, "name")) {
    data.name = String(data.name || "").trim();

    if (!data.name) {
      errors.push("Họ tên nhân viên không được để trống.");
    }
  }

  if (isCreate || Object.prototype.hasOwnProperty.call(data, "email")) {
    data.email = normalizeEmail(data.email);

    if (!data.email) {
      errors.push("Email không được để trống.");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(data.email)) {
        errors.push("Email không hợp lệ.");
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(data, "phone")) {
    data.phone = String(data.phone || "").trim();
  } else if (isCreate) {
    data.phone = "";
  }

  if (Object.prototype.hasOwnProperty.call(data, "position")) {
    data.position = String(data.position || "").trim();

    if (!data.position) {
      errors.push("Chức vụ không được để trống.");
    }
  } else if (isCreate) {
    data.position = "Nhân viên phục vụ";
  }

  if (Object.prototype.hasOwnProperty.call(data, "department")) {
    data.department = String(data.department || "").trim();

    if (!data.department) {
      errors.push("Bộ phận không được để trống.");
    }
  } else if (isCreate) {
    data.department = "Phục vụ";
  }

  if (Object.prototype.hasOwnProperty.call(data, "employmentType")) {
    if (!EMPLOYMENT_TYPES.includes(data.employmentType)) {
      errors.push("Hình thức làm việc không hợp lệ.");
    }
  } else if (isCreate) {
    data.employmentType = "Bán thời gian";
  }

  if (Object.prototype.hasOwnProperty.call(data, "payType")) {
    if (!PAY_TYPES.includes(data.payType)) {
      errors.push("Hình thức tính lương không hợp lệ.");
    }
  } else if (isCreate) {
    data.payType = "hourly";
  }

  if (Object.prototype.hasOwnProperty.call(data, "hourlyRate")) {
    const hourlyRate = Number(data.hourlyRate);

    if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
      errors.push("Lương theo giờ phải là số không âm.");
    } else {
      data.hourlyRate = hourlyRate;
    }
  } else if (isCreate) {
    data.hourlyRate = 0;
  }

  if (Object.prototype.hasOwnProperty.call(data, "dailyRate")) {
    const dailyRate = Number(data.dailyRate);

    if (!Number.isFinite(dailyRate) || dailyRate < 0) {
      errors.push("Lương theo ngày phải là số không âm.");
    } else {
      data.dailyRate = dailyRate;
    }
  } else if (isCreate) {
    data.dailyRate = 0;
  }

  if (Object.prototype.hasOwnProperty.call(data, "startDate")) {
    if (data.startDate === "" || data.startDate === null) {
      data.startDate = null;
    } else {
      const parsedDate = new Date(data.startDate);

      if (Number.isNaN(parsedDate.getTime())) {
        errors.push("Ngày bắt đầu làm việc không hợp lệ.");
      } else {
        data.startDate = parsedDate;
      }
    }
  } else if (isCreate) {
    data.startDate = null;
  }

  if (Object.prototype.hasOwnProperty.call(data, "note")) {
    data.note = String(data.note || "").trim();
  } else if (isCreate) {
    data.note = "";
  }

  if (Object.prototype.hasOwnProperty.call(data, "isActive")) {
    if (typeof data.isActive === "string") {
      data.isActive = data.isActive.toLowerCase() === "true";
    } else {
      data.isActive = Boolean(data.isActive);
    }
  } else if (isCreate) {
    data.isActive = true;
  }

  return { data, errors };
};

const employeeResponse = (employee) => {
  if (!employee) return null;

  const data =
    typeof employee.toObject === "function"
      ? employee.toObject()
      : { ...employee };

  delete data.password;
  delete data.__v;

  return data;
};

// GET /api/employees
exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    console.error("getEmployees error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách nhân viên.",
    });
  }
};

// GET /api/employees/:id
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID nhân viên không hợp lệ.",
      });
    }

    const employee = await User.findOne({
      _id: id,
      role: "employee",
    }).select("-password");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên.",
      });
    }

    return res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error("getEmployeeById error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin nhân viên.",
    });
  }
};

// POST /api/employees
exports.createEmployee = async (req, res) => {
  try {
    const input = pickEmployeeFields(req.body);
    const { data, errors } = validateEmployeeProfile(input, {
      isCreate: true,
    });

    if (!data.password || String(data.password).trim().length < 6) {
      errors.push("Mật khẩu phải có ít nhất 6 ký tự.");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu nhân viên không hợp lệ.",
        errors,
      });
    }

    const existingEmployee = await User.findOne({
      email: data.email,
    });

    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message: "Email này đã được sử dụng.",
      });
    }

    const hashedPassword = await bcrypt.hash(
      String(data.password),
      10
    );

    const employee = await User.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      role: "employee",
      isActive: data.isActive,
      position: data.position,
      department: data.department,
      employmentType: data.employmentType,
      payType: data.payType,
      hourlyRate: data.hourlyRate,
      dailyRate: data.dailyRate,
      startDate: data.startDate,
      note: data.note,
    });

    return res.status(201).json({
      success: true,
      message: "Tạo nhân viên thành công.",
      data: employeeResponse(employee),
    });
  } catch (error) {
    console.error("createEmployee error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email này đã được sử dụng.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi tạo nhân viên.",
    });
  }
};

// PUT /api/employees/:id
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID nhân viên không hợp lệ.",
      });
    }

    const employee = await User.findOne({
      _id: id,
      role: "employee",
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên.",
      });
    }

    const input = pickEmployeeFields(req.body);
    const { data, errors } = validateEmployeeProfile(input);

    if (Object.prototype.hasOwnProperty.call(data, "password")) {
      const password = String(data.password || "");

      if (password.length > 0 && password.length < 6) {
        errors.push("Mật khẩu mới phải có ít nhất 6 ký tự.");
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu cập nhật không hợp lệ.",
        errors,
      });
    }

    if (data.email && data.email !== employee.email) {
      const existingEmployee = await User.findOne({
        email: data.email,
        _id: { $ne: id },
      });

      if (existingEmployee) {
        return res.status(409).json({
          success: false,
          message: "Email này đã được sử dụng bởi tài khoản khác.",
        });
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, "password")) {
      const password = String(data.password || "");

      if (password.trim().length > 0) {
        employee.password = await bcrypt.hash(password, 10);
      }
    }

    const fieldsToUpdate = [
      "name",
      "email",
      "phone",
      "isActive",
      "position",
      "department",
      "employmentType",
      "payType",
      "hourlyRate",
      "dailyRate",
      "startDate",
      "note",
    ];

    fieldsToUpdate.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(data, field)) {
        employee[field] = data[field];
      }
    });

    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật nhân viên thành công.",
      data: employeeResponse(employee),
    });
  } catch (error) {
    console.error("updateEmployee error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email này đã được sử dụng.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi cập nhật nhân viên.",
    });
  }
};

// PATCH /api/employees/:id/status
exports.updateEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID nhân viên không hợp lệ.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive phải là true hoặc false.",
      });
    }

    const employee = await User.findOneAndUpdate(
      {
        _id: id,
        role: "employee",
      },
      { $set: { isActive } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên.",
      });
    }

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Đã kích hoạt nhân viên."
        : "Đã khóa nhân viên.",
      data: employee,
    });
  } catch (error) {
    console.error("updateEmployeeStatus error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật trạng thái nhân viên.",
    });
  }
};

// DELETE /api/employees/:id
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID nhân viên không hợp lệ.",
      });
    }

    const employee = await User.findOne({
      _id: id,
      role: "employee",
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên.",
      });
    }

    await EmployeeBiometric.deleteMany({
      userId: employee._id,
    });

    await employee.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Xóa nhân viên thành công.",
    });
  } catch (error) {
    console.error("deleteEmployee error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể xóa nhân viên.",
    });
  }
};

// GET /api/employees/:id/face
exports.getEmployeeFaceStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID nhân viên không hợp lệ.",
      });
    }

    const employee = await User.findOne({
      _id: id,
      role: "employee",
    }).select("-password");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên.",
      });
    }

    const biometric = await EmployeeBiometric.findOne({
      userId: employee._id,
    });

    return res.status(200).json({
      success: true,
      data: {
        employee,
        enrolled: Boolean(biometric),
        enrolledAt: biometric?.enrolledAt || null,
        lastVerifiedAt: biometric?.lastVerifiedAt || null,
        biometric: biometric
          ? {
              _id: biometric._id,
              enrolledAt: biometric.enrolledAt,
              updatedAt: biometric.updatedAt,
              lastVerifiedAt: biometric.lastVerifiedAt || null,
              enrollmentVersion: biometric.enrollmentVersion,
              isActive: biometric.isActive,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("getEmployeeFaceStatus error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể kiểm tra trạng thái Face ID.",
    });
  }
};

// POST /api/employees/:id/face/enroll
exports.enrollEmployeeFace = async (req, res) => {
  try {
    const { id } = req.params;
    const descriptor = Array.from(req.body?.descriptor || []);

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID nhân viên không hợp lệ.",
      });
    }

    const employee = await User.findOne({
      _id: id,
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
        message: "Nhân viên đang bị khóa, không thể đăng ký Face ID.",
      });
    }

    if (
      descriptor.length !== 128 ||
      !descriptor.every(
        (value) =>
          typeof value === "number" &&
          Number.isFinite(value)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu khuôn mặt không hợp lệ.",
      });
    }

    const existingBiometric = await EmployeeBiometric.findOne({
      userId: employee._id,
    });

    if (existingBiometric) {
      return res.status(409).json({
        success: false,
        message: "Nhân viên đã đăng ký Face ID. Hãy xóa Face ID cũ trước khi đăng ký lại.",
        data: {
          enrolled: true,
          enrolledAt: existingBiometric.enrolledAt || null,
        },
      });
    }

    const biometric = await EmployeeBiometric.create({
      userId: employee._id,
      descriptor,
      enrolledAt: new Date(),
      enrollmentVersion: 1,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Đăng ký Face ID thành công.",
      data: {
        employeeId: employee._id,
        enrolled: true,
        enrolledAt: biometric.enrolledAt,
      },
    });
  } catch (error) {
    console.error("enrollEmployeeFace error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Nhân viên đã đăng ký Face ID.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Không thể đăng ký Face ID.",
    });
  }
};

// DELETE /api/employees/:id/face
exports.deleteEmployeeFace = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID nhân viên không hợp lệ.",
      });
    }

    const employee = await User.findOne({
      _id: id,
      role: "employee",
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên.",
      });
    }

    const result = await EmployeeBiometric.deleteMany({
      userId: employee._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Nhân viên chưa đăng ký Face ID.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Đã xóa Face ID của nhân viên.",
      data: {
        employeeId: employee._id,
        enrolled: false,
      },
    });
  } catch (error) {
    console.error("deleteEmployeeFace error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể xóa Face ID.",
    });
  }
};

// PUT /api/employees/:id/password
exports.changeEmployeePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID nhân viên không hợp lệ.",
      });
    }

    if (
      typeof password !== "string" ||
      password.trim().length < 6
    ) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có ít nhất 6 ký tự.",
      });
    }

    const employee = await User.findOne({
      _id: id,
      role: "employee",
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên.",
      });
    }

    employee.password = await bcrypt.hash(password, 10);
    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Đổi mật khẩu nhân viên thành công.",
    });
  } catch (error) {
    console.error("changeEmployeePassword error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể đổi mật khẩu nhân viên.",
    });
  }
};

// Tương thích với employeeRoutes.js
exports.completeFaceEnrollment = exports.enrollEmployeeFace;
exports.getFaceStatus = exports.getEmployeeFaceStatus;
exports.deleteFace = exports.deleteEmployeeFace;
