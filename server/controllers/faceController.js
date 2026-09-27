const User = require("../models/User");
const EmployeeBiometric = require("../models/EmployeeBiometric");

// ===============================
// CONFIG
// ===============================

// Face-api.js thường dùng Euclidean distance.
// Distance càng nhỏ thì càng giống.
//
// 0.45 - 0.55: tương đối chặt
// 0.60: phổ biến hơn nhưng dễ nhận nhầm hơn.
//
// Với chấm công, bắt đầu bằng 0.50.
const FACE_MATCH_THRESHOLD = Number(
  process.env.FACE_MATCH_THRESHOLD || 0.5
);

// ===============================
// HELPERS
// ===============================

const getUserId = (req) => {
  return req.user?.id || req.user?._id;
};

const validateDescriptor = (descriptor) => {
  if (!Array.isArray(descriptor)) {
    return false;
  }

  if (descriptor.length !== 128) {
    return false;
  }

  return descriptor.every(
    (value) =>
      typeof value === "number" &&
      Number.isFinite(value)
  );
};

const calculateEuclideanDistance = (
  descriptorA,
  descriptorB
) => {
  if (
    !Array.isArray(descriptorA) ||
    !Array.isArray(descriptorB) ||
    descriptorA.length !== descriptorB.length
  ) {
    return Infinity;
  }

  let sum = 0;

  for (let i = 0; i < descriptorA.length; i++) {
    const difference =
      descriptorA[i] - descriptorB[i];

    sum += difference * difference;
  }

  return Math.sqrt(sum);
};

// ===============================
// GET MY FACE STATUS
// ===============================

const getMyFaceStatus = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Không xác định được tài khoản.",
      });
    }

    const biometric =
      await EmployeeBiometric.findOne({
        userId,
        isActive: true,
      }).select(
        "userId enrolledAt updatedAt enrollmentVersion isActive"
      );

    return res.json({
      success: true,
      enrolled: !!biometric,
      data: biometric || null,
    });
  } catch (error) {
    console.error(
      "GET MY FACE STATUS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Không thể kiểm tra trạng thái khuôn mặt.",
    });
  }
};

// ===============================
// GET EMPLOYEE FACE STATUS
// ADMIN
// ===============================

const getEmployeeFaceStatus = async (
  req,
  res
) => {
  try {
    const { employeeId } = req.params;

    const employee = await User.findOne({
      _id: employeeId,
      role: "employee",
    }).select("_id name email role isActive");

    if (!employee) {
      return res.status(404).json({
        message: "Không tìm thấy nhân viên.",
      });
    }

    const biometric =
      await EmployeeBiometric.findOne({
        userId: employeeId,
      }).select(
        "userId enrolledAt updatedAt enrollmentVersion isActive"
      );

    return res.json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          isActive: employee.isActive,
        },
        enrolled: !!biometric,
        biometric: biometric || null,
      },
    });
  } catch (error) {
    console.error(
      "GET EMPLOYEE FACE STATUS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Không thể kiểm tra khuôn mặt nhân viên.",
    });
  }
};

// ===============================
// ENROLL FACE
// ADMIN
// ===============================

const enrollFace = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { descriptor } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        message: "Thiếu employeeId.",
      });
    }

    if (!validateDescriptor(descriptor)) {
      return res.status(400).json({
        message:
          "Face descriptor không hợp lệ. Cần đúng 128 số.",
      });
    }

    const employee = await User.findOne({
      _id: employeeId,
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

    const existing =
      await EmployeeBiometric.findOne({
        userId: employeeId,
      });

    if (existing) {
      existing.descriptor = descriptor;
      existing.updatedAt = new Date();
      existing.enrollmentVersion =
        (existing.enrollmentVersion || 1) + 1;
      existing.isActive = true;

      await existing.save();

      return res.json({
        success: true,
        message:
          "Đã cập nhật khuôn mặt nhân viên.",
        data: {
          userId: employee._id,
          enrolledAt: existing.enrolledAt,
          updatedAt: existing.updatedAt,
          enrollmentVersion:
            existing.enrollmentVersion,
        },
      });
    }

    const biometric =
      await EmployeeBiometric.create({
        userId: employee._id,
        descriptor,
        enrolledAt: new Date(),
        updatedAt: new Date(),
        enrollmentVersion: 1,
        isActive: true,
      });

    return res.status(201).json({
      success: true,
      message:
        "Đăng ký khuôn mặt thành công.",
      data: {
        userId: employee._id,
        enrolledAt: biometric.enrolledAt,
        updatedAt: biometric.updatedAt,
        enrollmentVersion:
          biometric.enrollmentVersion,
      },
    });
  } catch (error) {
    console.error(
      "ENROLL FACE ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Không thể đăng ký khuôn mặt.",
    });
  }
};

// ===============================
// VERIFY FACE
// EMPLOYEE
// ===============================

const verifyFace = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { descriptor } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Không xác định được tài khoản.",
      });
    }

    if (!validateDescriptor(descriptor)) {
      return res.status(400).json({
        message:
          "Face descriptor không hợp lệ.",
      });
    }

    const employee = await User.findOne({
      _id: userId,
      role: "employee",
    }).select(
      "_id name email role isActive"
    );

    if (!employee) {
      return res.status(403).json({
        message:
          "Tài khoản hiện tại không phải nhân viên.",
      });
    }

    if (!employee.isActive) {
      return res.status(403).json({
        message:
          "Tài khoản nhân viên đang bị khóa.",
      });
    }

    const biometric =
      await EmployeeBiometric.findOne({
        userId,
        isActive: true,
      });

    if (!biometric) {
      return res.status(404).json({
        message:
          "Nhân viên chưa đăng ký khuôn mặt.",
        enrolled: false,
      });
    }

    const distance =
      calculateEuclideanDistance(
        descriptor,
        biometric.descriptor
      );

    const matched =
      distance <= FACE_MATCH_THRESHOLD;

    if (!matched) {
      return res.status(401).json({
        success: false,
        matched: false,
        message:
          "Khuôn mặt không khớp với tài khoản.",
        distance: Number(
          distance.toFixed(4)
        ),
      });
    }

    return res.json({
      success: true,
      matched: true,
      message:
        "Xác thực khuôn mặt thành công.",
      data: {
        userId: employee._id,
        name: employee.name,
        distance: Number(
          distance.toFixed(4)
        ),
        threshold:
          FACE_MATCH_THRESHOLD,
      },
    });
  } catch (error) {
    console.error(
      "VERIFY FACE ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Không thể xác thực khuôn mặt.",
    });
  }
};

// ===============================
// DELETE FACE
// ADMIN
// ===============================

const deleteFace = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await User.findOne({
      _id: employeeId,
      role: "employee",
    });

    if (!employee) {
      return res.status(404).json({
        message: "Không tìm thấy nhân viên.",
      });
    }

    const deleted =
      await EmployeeBiometric.findOneAndDelete({
        userId: employeeId,
      });

    if (!deleted) {
      return res.status(404).json({
        message:
          "Nhân viên chưa có dữ liệu khuôn mặt.",
      });
    }

    return res.json({
      success: true,
      message:
        "Đã xóa dữ liệu khuôn mặt.",
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

module.exports = {
  getMyFaceStatus,
  getEmployeeFaceStatus,
  enrollFace,
  verifyFace,
  deleteFace,
};