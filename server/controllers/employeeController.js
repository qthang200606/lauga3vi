const User = require("../models/User");
const bcrypt = require("bcryptjs");
const {
  createLivenessSession,
  getLivenessResult,
  enrollFace,
  deleteEmployeeFaces,
  getEmployeeFaces,
  LIVENESS_THRESHOLD,
} = require("../services/rekognitionService");

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
    console.error("GET EMPLOYEES ERROR:", error);

    res.status(500).json({
      message: "Không thể tải danh sách nhân viên.",
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

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
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
      phone: phone?.trim() || "",
      role: "employee",
      authProvider: "local",
    });

    res.status(201).json({
      success: true,
      message: "Tạo tài khoản nhân viên thành công.",
      data: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
      },
    });
  } catch (error) {
    console.error("CREATE EMPLOYEE ERROR:", error);

    res.status(500).json({
      message: "Không thể tạo tài khoản nhân viên.",
    });
  }
};

// =====================================================
// UPDATE EMPLOYEE
// =====================================================

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      phone,
    } = req.body;

    const employee = await User.findOne({
      _id: id,
      role: "employee",
    });

    if (!employee) {
      return res.status(404).json({
        message: "Không tìm thấy nhân viên.",
      });
    }

    if (email) {
      const normalizedEmail = email
        .trim()
        .toLowerCase();

      const duplicate = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: id },
      });

      if (duplicate) {
        return res.status(400).json({
          message: "Email này đã được sử dụng.",
        });
      }

      employee.email = normalizedEmail;
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
      message: "Cập nhật nhân viên thành công.",
      data: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
      },
    });
  } catch (error) {
    console.error("UPDATE EMPLOYEE ERROR:", error);

    res.status(500).json({
      message: "Không thể cập nhật nhân viên.",
    });
  }
};

// =====================================================
// DELETE EMPLOYEE
// =====================================================

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await User.findOneAndDelete({
      _id: id,
      role: "employee",
    });

    if (!employee) {
      return res.status(404).json({
        message: "Không tìm thấy nhân viên.",
      });
    }

    res.json({
      success: true,
      message: "Đã xóa tài khoản nhân viên.",
    });
  } catch (error) {
    console.error("DELETE EMPLOYEE ERROR:", error);

    res.status(500).json({
      message: "Không thể xóa nhân viên.",
    });
  }
};

// =====================================================
// CHANGE PASSWORD
// =====================================================

exports.changeEmployeePassword = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        message:
          "Mật khẩu phải có ít nhất 6 ký tự.",
      });
    }

    const employee = await User.findOne({
      _id: id,
      role: "employee",
    });

    if (!employee) {
      return res.status(404).json({
        message: "Không tìm thấy nhân viên.",
      });
    }

    employee.password = await bcrypt.hash(
      password,
      10
    );

    employee.authProvider = "local";

    await employee.save();

    res.json({
      success: true,
      message: "Đổi mật khẩu thành công.",
    });
  } catch (error) {
    console.error(
      "CHANGE EMPLOYEE PASSWORD ERROR:",
      error
    );

    res.status(500).json({
      message: "Không thể đổi mật khẩu.",
    });
  }
};
// =====================================================
// CREATE FACE LIVENESS SESSION
// =====================================================

exports.createFaceEnrollmentSession = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const employee = await User.findOne({
      _id: id,
      role: "employee",
    });

    if (!employee) {
      return res.status(404).json({
        message: "Không tìm thấy nhân viên.",
      });
    }

    if (!employee.isActive) {
      return res.status(400).json({
        message:
          "Tài khoản nhân viên đang bị khóa.",
      });
    }

    const session =
      await createLivenessSession();

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error(
      "CREATE FACE SESSION ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Không thể tạo phiên xác thực khuôn mặt.",
    });
  }
};
// =====================================================
// COMPLETE FACE ENROLLMENT
// =====================================================

exports.completeFaceEnrollment = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        message:
          "Thiếu mã phiên xác thực.",
      });
    }

    const employee = await User.findOne({
      _id: id,
      role: "employee",
    });

    if (!employee) {
      return res.status(404).json({
        message: "Không tìm thấy nhân viên.",
      });
    }

    if (!employee.isActive) {
      return res.status(400).json({
        message:
          "Tài khoản nhân viên đang bị khóa.",
      });
    }

    const result =
      await getLivenessResult(
        sessionId
      );

    if (result.Status !== "SUCCEEDED") {
      return res.status(400).json({
        message:
          "Xác thực người thật thất bại.",
        status: result.Status,
      });
    }

    const confidence =
      Number(result.Confidence || 0);

    if (
      confidence <
      LIVENESS_THRESHOLD
    ) {
      return res.status(400).json({
        message:
          "Độ tin cậy xác thực người thật chưa đạt yêu cầu.",
        confidence,
      });
    }

    if (
      !result.ReferenceImage ||
      !result.ReferenceImage.Bytes
    ) {
      return res.status(400).json({
        message:
          "Không lấy được ảnh tham chiếu khuôn mặt.",
      });
    }

    // UserId AWS không chứa email/name
    // chỉ dùng ID MongoDB để liên kết employee.
    const rekognitionUserId =
      `employee-${employee._id.toString()}`;

    // Nếu đăng ký lại → xóa face cũ
    if (
      employee.faceVerification
        ?.rekognitionUserId
    ) {
      try {
        await deleteEmployeeFaces(
          employee.faceVerification
            .rekognitionUserId
        );
      } catch (error) {
        console.error(
          "DELETE OLD FACE ERROR:",
          error
        );
      }
    }

    const enrolled =
      await enrollFace({
        rekognitionUserId,
        imageBytes:
          result.ReferenceImage.Bytes,
      });

    employee.faceVerification = {
      enrolled: true,

      provider:
        "aws_rekognition",

      rekognitionUserId,

      faceIds: [
        enrolled.faceId,
      ],

      enrolledAt: new Date(),

      lastVerifiedAt: null,

      updatedAt: new Date(),
    };

    await employee.save();

    return res.json({
      success: true,

      message:
        "Đăng ký khuôn mặt thành công.",

      data: {
        enrolled: true,

        enrolledAt:
          employee.faceVerification
            .enrolledAt,
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

    const employee = await User.findOne({
      _id: id,
      role: "employee",
    }).select(
      "name email faceVerification"
    );

    if (!employee) {
      return res.status(404).json({
        message: "Không tìm thấy nhân viên.",
      });
    }

    return res.json({
      success: true,

      data: {
        enrolled:
          employee.faceVerification
            ?.enrolled === true,

        enrolledAt:
          employee.faceVerification
            ?.enrolledAt || null,

        lastVerifiedAt:
          employee.faceVerification
            ?.lastVerifiedAt || null,
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

    const employee = await User.findOne({
      _id: id,
      role: "employee",
    });

    if (!employee) {
      return res.status(404).json({
        message: "Không tìm thấy nhân viên.",
      });
    }

    const rekognitionUserId =
      employee.faceVerification
        ?.rekognitionUserId;

    if (rekognitionUserId) {
      await deleteEmployeeFaces(
        rekognitionUserId
      );
    }

    employee.faceVerification = {
      enrolled: false,

      provider:
        "aws_rekognition",

      rekognitionUserId: null,

      faceIds: [],

      enrolledAt: null,

      lastVerifiedAt: null,

      updatedAt: new Date(),
    };

    await employee.save();

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