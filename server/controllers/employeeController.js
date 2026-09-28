const mongoose = require("mongoose");
const User = require("../models/User");
const EmployeeBiometric = require("../models/EmployeeBiometric");
const bcrypt = require("bcryptjs");

// =====================================================
// HELPERS
// =====================================================

const isValidId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const validateDescriptor = (descriptor) => {
  return (
    Array.isArray(descriptor) &&
    descriptor.length === 128 &&
    descriptor.every(
      (value) =>
        typeof value === "number" &&
        Number.isFinite(value)
    )
  );
};

const employeeNotFound = (res) =>
  res.status(404).json({
    success: false,
    message: "Không tìm thấy nhân viên.",
  });

// =====================================================
// GET ALL EMPLOYEES
// GET /api/employees
// =====================================================

exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find({
      role: "employee",
    })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error("GET EMPLOYEES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể tải danh sách nhân viên.",
    });
  }
};

// =====================================================
// CREATE EMPLOYEE
// POST /api/employees
// =====================================================

exports.createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      isActive = true,
    } = req.body || {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Vui lòng nhập họ tên, email và mật khẩu.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Mật khẩu phải có ít nhất 6 ký tự.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Trạng thái nhân viên không hợp lệ.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email này đã được sử dụng.",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const employee = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone:
        typeof phone === "string"
          ? phone.trim()
          : "",
      role: "employee",
      isActive,
      authProvider: "local",
    });

    return res.status(201).json({
      success: true,
      message: "Tạo tài khoản nhân viên thành công.",
      data: {
        _id: employee._id,
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        isActive: employee.isActive,
      },
    });
  } catch (error) {
    console.error("CREATE EMPLOYEE ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email này đã được sử dụng.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Không thể tạo tài khoản nhân viên.",
    });
  }
};

// =====================================================
// UPDATE EMPLOYEE
// PUT /api/employees/:id
// =====================================================

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Mã nhân viên không hợp lệ.",
      });
    }

    const {
      name,
      email,
      phone,
      password,
      isActive,
    } = req.body || {};

    const employee = await User.findOne({
      _id: id,
      role: "employee",
    });

    if (!employee) {
      return employeeNotFound(res);
    }

    // Cập nhật họ tên
    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Họ tên không được để trống.",
        });
      }

      employee.name = name.trim();
    }

    // Cập nhật email
    if (email !== undefined) {
      if (
        typeof email !== "string" ||
        !email.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Email không được để trống.",
        });
      }

      const normalizedEmail = email
        .trim()
        .toLowerCase();

      const duplicate = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: employee._id },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Email này đã được sử dụng.",
        });
      }

      employee.email = normalizedEmail;
    }

    // Cập nhật số điện thoại
    if (phone !== undefined) {
      if (typeof phone !== "string") {
        return res.status(400).json({
          success: false,
          message: "Số điện thoại không hợp lệ.",
        });
      }

      employee.phone = phone.trim();
    }

    // Cập nhật trạng thái nếu frontend gửi lên
    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Trạng thái nhân viên không hợp lệ.",
        });
      }

      employee.isActive = isActive;
    }

    // Đổi mật khẩu nếu có nhập mật khẩu mới
    if (password !== undefined && password !== "") {
      if (
        typeof password !== "string" ||
        password.length < 6
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Mật khẩu mới phải có ít nhất 6 ký tự.",
        });
      }

      employee.password = await bcrypt.hash(
        password,
        10
      );

      employee.authProvider = "local";
    }

    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật nhân viên thành công.",
      data: {
        _id: employee._id,
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        isActive: employee.isActive,
      },
    });
  } catch (error) {
    console.error("UPDATE EMPLOYEE ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email này đã được sử dụng.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật nhân viên.",
    });
  }
};

// =====================================================
// UPDATE EMPLOYEE STATUS
// PATCH /api/employees/:id/status
// =====================================================

exports.updateEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body || {};

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Mã nhân viên không hợp lệ.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message:
          "Trạng thái phải là true hoặc false.",
      });
    }

    const employee = await User.findOne({
      _id: id,
      role: "employee",
    });

    if (!employee) {
      return employeeNotFound(res);
    }

    // Không cập nhật nếu trạng thái không thay đổi
    if (employee.isActive === isActive) {
      return res.status(200).json({
        success: true,
        message: isActive
          ? "Tài khoản nhân viên đang hoạt động."
          : "Tài khoản nhân viên đã bị khóa.",
        data: {
          _id: employee._id,
          name: employee.name,
          isActive: employee.isActive,
        },
      });
    }

    employee.isActive = isActive;
    await employee.save();

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Đã mở khóa tài khoản nhân viên."
        : "Đã khóa tài khoản nhân viên.",
      data: {
        _id: employee._id,
        name: employee.name,
        isActive: employee.isActive,
      },
    });
  } catch (error) {
    console.error(
      "UPDATE EMPLOYEE STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Không thể cập nhật trạng thái nhân viên.",
    });
  }
};

// =====================================================
// DELETE EMPLOYEE
// DELETE /api/employees/:id
// =====================================================

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Mã nhân viên không hợp lệ.",
      });
    }

    const employee = await User.findOne({
      _id: id,
      role: "employee",
    });

    if (!employee) {
      return employeeNotFound(res);
    }

    // Xóa dữ liệu Face ID trước
    await EmployeeBiometric.deleteOne({
      userId: employee._id,
    });

    // Xóa tài khoản nhân viên
    await User.deleteOne({
      _id: employee._id,
      role: "employee",
    });

    return res.status(200).json({
      success: true,
      message:
        "Đã xóa tài khoản và dữ liệu Face ID của nhân viên.",
    });
  } catch (error) {
    console.error("DELETE EMPLOYEE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể xóa nhân viên.",
    });
  }
};

// =====================================================
// CHANGE EMPLOYEE PASSWORD
// PUT /api/employees/:id/password
// =====================================================

exports.changeEmployeePassword = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { password } = req.body || {};

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Mã nhân viên không hợp lệ.",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 6
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Mật khẩu phải có ít nhất 6 ký tự.",
      });
    }

    const employee = await User.findOne({
      _id: id,
      role: "employee",
    });

    if (!employee) {
      return employeeNotFound(res);
    }

    employee.password = await bcrypt.hash(
      password,
      10
    );
    employee.authProvider = "local";

    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công.",
    });
  } catch (error) {
    console.error(
      "CHANGE EMPLOYEE PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Không thể đổi mật khẩu.",
    });
  }
};

// =====================================================
// ENROLL FACE ID
// POST /api/employees/:id/face/enroll
// Chỉ tạo mới, không ghi đè Face ID đã có
// =====================================================

exports.completeFaceEnrollment = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { descriptor } = req.body || {};

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Mã nhân viên không hợp lệ.",
      });
    }

    if (!validateDescriptor(descriptor)) {
      return res.status(400).json({
        success: false,
        message:
          "Face descriptor không hợp lệ. Cần đúng 128 giá trị số.",
      });
    }

    const employee = await User.findOne({
      _id: id,
      role: "employee",
    });

    if (!employee) {
      return employeeNotFound(res);
    }

    if (!employee.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "Tài khoản nhân viên đang bị khóa.",
      });
    }

    // Có dữ liệu Face ID rồi thì tuyệt đối không ghi đè
    const existing = await EmployeeBiometric.findOne({
      userId: employee._id,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        enrolled: true,
        message:
          "Nhân viên đã đăng ký Face ID. Không thể đăng ký lại.",
      });
    }

    const biometric = await EmployeeBiometric.create({
      userId: employee._id,
      provider: "face-api",
      descriptor,
      enrolledAt: new Date(),
      lastVerifiedAt: null,
      enrollmentVersion: 1,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Đăng ký Face ID thành công.",
      data: {
        userId: employee._id,
        enrolled: true,
        enrolledAt: biometric.enrolledAt,
        updatedAt: biometric.updatedAt,
        enrollmentVersion:
          biometric.enrollmentVersion,
      },
    });
  } catch (error) {
    console.error(
      "COMPLETE FACE ENROLLMENT ERROR:",
      error
    );

    // Trường hợp hai yêu cầu đăng ký đến gần như cùng lúc
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        enrolled: true,
        message:
          "Nhân viên đã đăng ký Face ID. Không thể đăng ký lại.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Không thể đăng ký Face ID.",
    });
  }
};

// =====================================================
// GET FACE STATUS
// GET /api/employees/:id/face
// =====================================================

exports.getFaceStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Mã nhân viên không hợp lệ.",
      });
    }

    const employee = await User.findOne({
      _id: id,
      role: "employee",
    }).select("_id name email role isActive");

    if (!employee) {
      return employeeNotFound(res);
    }

    const biometric = await EmployeeBiometric.findOne({
      userId: employee._id,
    }).select(
      "userId provider enrolledAt updatedAt enrollmentVersion isActive lastVerifiedAt"
    );

    const enrolled =
      !!biometric && biometric.isActive !== false;

    return res.status(200).json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          isActive: employee.isActive,
        },
        enrolled,
        enrolledAt: biometric?.enrolledAt || null,
        lastVerifiedAt:
          biometric?.lastVerifiedAt || null,
        biometric: biometric || null,
      },
    });
  } catch (error) {
    console.error("GET FACE STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể lấy trạng thái Face ID.",
    });
  }
};

// =====================================================
// DELETE FACE ID
// DELETE /api/employees/:id/face
// =====================================================

exports.deleteFace = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Mã nhân viên không hợp lệ.",
      });
    }

    const employee = await User.findOne({
      _id: id,
      role: "employee",
    });

    if (!employee) {
      return employeeNotFound(res);
    }

    const result = await EmployeeBiometric.deleteOne({
      userId: employee._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        enrolled: false,
        message:
          "Nhân viên chưa có dữ liệu Face ID.",
      });
    }

    return res.status(200).json({
      success: true,
      enrolled: false,
      message:
        "Đã xóa dữ liệu Face ID của nhân viên.",
    });
  } catch (error) {
    console.error("DELETE FACE ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        "Không thể xóa dữ liệu khuôn mặt.",
    });
  }
};