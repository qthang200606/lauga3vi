const User = require("../models/User");
const bcrypt = require("bcryptjs");
const EmployeeBiometric = require("../models/EmployeeBiometric");

// =====================================================
// GET ALL EMPLOYEES
// =====================================================

exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find({
      role: "employee",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error(
      "GET EMPLOYEES ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Không thể tải danh sách nhân viên.",
    });
  }
};

// =====================================================
// CREATE EMPLOYEE
// =====================================================

exports.createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Vui lòng nhập họ tên, email và mật khẩu.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(400).json({
        message:
          "Email này đã được sử dụng.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const employee = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone?.trim() || "",
      role: "employee",
      authProvider: "local",
    });

    res.status(201).json({
      success: true,

      message:
        "Tạo tài khoản nhân viên thành công.",

      data: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
      },
    });
  } catch (error) {
    console.error(
      "CREATE EMPLOYEE ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Không thể tạo tài khoản nhân viên.",
    });
  }
};

// =====================================================
// UPDATE EMPLOYEE
// =====================================================

exports.updateEmployee = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      phone,
    } = req.body;

    const employee =
      await User.findOne({
        _id: id,
        role: "employee",
      });

    if (!employee) {
      return res.status(404).json({
        message:
          "Không tìm thấy nhân viên.",
      });
    }

    if (email) {
      const normalizedEmail =
        email.trim().toLowerCase();

      const duplicate =
        await User.findOne({
          email: normalizedEmail,
          _id: { $ne: id },
        });

      if (duplicate) {
        return res.status(400).json({
          message:
            "Email này đã được sử dụng.",
        });
      }

      employee.email =
        normalizedEmail;
    }

    if (name !== undefined) {
      employee.name = name.trim();
    }

    if (phone !== undefined) {
      employee.phone = phone.trim();
    }

    await employee.save();

    res.json({
      success: true,

      message:
        "Cập nhật nhân viên thành công.",

      data: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
      },
    });
  } catch (error) {
    console.error(
      "UPDATE EMPLOYEE ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Không thể cập nhật nhân viên.",
    });
  }
};

// =====================================================
// DELETE EMPLOYEE
// =====================================================

exports.deleteEmployee = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const employee =
      await User.findOneAndDelete({
        _id: id,
        role: "employee",
      });

    if (!employee) {
      return res.status(404).json({
        message:
          "Không tìm thấy nhân viên.",
      });
    }

    // Xóa luôn dữ liệu khuôn mặt
    await EmployeeBiometric.deleteOne({
      userId: employee._id,
    });

    res.json({
      success: true,

      message:
        "Đã xóa tài khoản nhân viên.",
    });
  } catch (error) {
    console.error(
      "DELETE EMPLOYEE ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Không thể xóa nhân viên.",
    });
  }
};

// =====================================================
// CHANGE PASSWORD
// =====================================================

exports.changeEmployeePassword =
  async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (
        !password ||
        password.length < 6
      ) {
        return res.status(400).json({
          message:
            "Mật khẩu phải có ít nhất 6 ký tự.",
        });
      }

      const employee =
        await User.findOne({
          _id: id,
          role: "employee",
        });

      if (!employee) {
        return res.status(404).json({
          message:
            "Không tìm thấy nhân viên.",
        });
      }

      employee.password =
        await bcrypt.hash(
          password,
          10
        );

      employee.authProvider = "local";

      await employee.save();

      res.json({
        success: true,

        message:
          "Đổi mật khẩu thành công.",
      });
    } catch (error) {
      console.error(
        "CHANGE EMPLOYEE PASSWORD ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Không thể đổi mật khẩu.",
      });
    }
  };

// =====================================================
// ENROLL FACE
// =====================================================

exports.completeFaceEnrollment =
  async (req, res) => {
    try {
      const { id } = req.params;
      const { descriptor } = req.body;

      // ==========================================
      // KIỂM TRA DESCRIPTOR
      // ==========================================

      if (
        !Array.isArray(descriptor)
      ) {
        return res.status(400).json({
          message:
            "Thiếu dữ liệu khuôn mặt.",
        });
      }

      if (
        descriptor.length !== 128
      ) {
        return res.status(400).json({
          message:
            "Face descriptor phải có đúng 128 giá trị.",
        });
      }

      const invalidValue =
        descriptor.some(
          (value) =>
            typeof value !== "number" ||
            !Number.isFinite(value)
        );

      if (invalidValue) {
        return res.status(400).json({
          message:
            "Face descriptor chứa dữ liệu không hợp lệ.",
        });
      }

      // ==========================================
      // TÌM NHÂN VIÊN
      // ==========================================

      const employee =
        await User.findOne({
          _id: id,
          role: "employee",
        });

      if (!employee) {
        return res.status(404).json({
          message:
            "Không tìm thấy nhân viên.",
        });
      }

      if (!employee.isActive) {
        return res.status(400).json({
          message:
            "Tài khoản nhân viên đang bị khóa.",
        });
      }

      // ==========================================
      // LƯU KHUÔN MẶT
      // ==========================================

      const biometric =
        await EmployeeBiometric.findOneAndUpdate(
          {
            userId: employee._id,
          },
          {
            userId: employee._id,

            provider: "face-api",

            descriptor,

            enrolledAt: new Date(),

            lastVerifiedAt: null,
          },
          {
            new: true,

            upsert: true,

            runValidators: true,

            setDefaultsOnInsert: true,
          }
        );

      return res.json({
        success: true,

        message:
          "Đăng ký khuôn mặt thành công.",

        data: {
          enrolled: true,

          enrolledAt:
            biometric.enrolledAt,
        },
      });
    } catch (error) {
      console.error(
        "COMPLETE FACE ENROLLMENT ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Không thể đăng ký khuôn mặt.",
      });
    }
  };

// =====================================================
// GET FACE STATUS
// =====================================================

exports.getFaceStatus = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const employee =
      await User.findOne({
        _id: id,
        role: "employee",
      });

    if (!employee) {
      return res.status(404).json({
        message:
          "Không tìm thấy nhân viên.",
      });
    }

    const biometric =
      await EmployeeBiometric.findOne({
        userId: employee._id,
      });

    return res.json({
      success: true,

      data: {
        enrolled:
          !!biometric,

        enrolledAt:
          biometric?.enrolledAt ||
          null,

        lastVerifiedAt:
          biometric?.lastVerifiedAt ||
          null,
      },
    });
  } catch (error) {
    console.error(
      "GET FACE STATUS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Không thể lấy trạng thái khuôn mặt.",
    });
  }
};

// =====================================================
// DELETE FACE
// =====================================================

exports.deleteFace = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const employee =
      await User.findOne({
        _id: id,
        role: "employee",
      });

    if (!employee) {
      return res.status(404).json({
        message:
          "Không tìm thấy nhân viên.",
      });
    }

    await EmployeeBiometric.deleteOne({
      userId: employee._id,
    });

    return res.json({
      success: true,

      message:
        "Đã xóa dữ liệu khuôn mặt của nhân viên.",
    });
  } catch (error) {
    console.error(
      "DELETE FACE ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Không thể xóa dữ liệu khuôn mặt.",
    });
  }
};