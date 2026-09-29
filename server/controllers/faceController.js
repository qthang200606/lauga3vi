
const User = require("../models/User");
const EmployeeBiometric = require("../models/EmployeeBiometric");

const FACE_MATCH_THRESHOLD = Number(
  process.env.FACE_MATCH_THRESHOLD || 0.5
);

const getUserId = (req) =>
  req.user?.id || req.user?._id;

const validateDescriptor = (descriptor) =>
  Array.isArray(descriptor) &&
  descriptor.length === 128 &&
  descriptor.every(
    (value) =>
      typeof value === "number" &&
      Number.isFinite(value)
  );

const calculateEuclideanDistance = (
  descriptorA,
  descriptorB
) => {
  if (
    !Array.isArray(descriptorA) ||
    !Array.isArray(descriptorB) ||
    descriptorA.length !== 128 ||
    descriptorB.length !== 128
  ) {
    return Infinity;
  }

  let sum = 0;

  for (let i = 0; i < 128; i++) {
    const difference = descriptorA[i] - descriptorB[i];
    sum += difference * difference;
  }

  return Math.sqrt(sum);
};

// GET /api/face/my
const getMyFaceStatus = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được tài khoản.",
      });
    }

    const biometric = await EmployeeBiometric.findOne({
      userId,
      isActive: true,
    }).select(
      "userId enrolledAt updatedAt enrollmentVersion isActive"
    );

    return res.status(200).json({
      success: true,
      enrolled: Boolean(biometric),
      data: biometric || null,
    });
  } catch (error) {
    console.error("GET MY FACE STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể kiểm tra trạng thái khuôn mặt.",
    });
  }
};

// GET /api/face/employee/:employeeId
const getEmployeeFaceStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId || !/^[a-f\d]{24}$/i.test(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "ID nhân viên không hợp lệ.",
      });
    }

    const employee = await User.findOne({
      _id: employeeId,
      role: "employee",
    }).select("_id name email role isActive");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên.",
      });
    }

    const biometric = await EmployeeBiometric.findOne({
      userId: employee._id,
    }).select(
      "userId enrolledAt updatedAt enrollmentVersion isActive"
    );

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
        enrolled: Boolean(biometric),
        biometric: biometric || null,
      },
    });
  } catch (error) {
    console.error("GET EMPLOYEE FACE STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể kiểm tra khuôn mặt nhân viên.",
    });
  }
};

// POST /api/face/employee/:employeeId/enroll
const enrollFace = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const descriptor = Array.from(req.body?.descriptor || []);

    if (!employeeId || !/^[a-f\d]{24}$/i.test(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "ID nhân viên không hợp lệ.",
      });
    }

    if (!validateDescriptor(descriptor)) {
      return res.status(400).json({
        success: false,
        message: "Face descriptor không hợp lệ. Cần đúng 128 số.",
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
        message: "Tài khoản nhân viên đang bị khóa.",
      });
    }

    let biometric = await EmployeeBiometric.findOne({
      userId: employee._id,
    });

    if (biometric) {
      biometric.descriptor = descriptor;
      biometric.enrolledAt = new Date();
      biometric.enrollmentVersion =
        (biometric.enrollmentVersion || 1) + 1;
      biometric.isActive = true;

      await biometric.save();

      return res.status(200).json({
        success: true,
        message: "Đã cập nhật khuôn mặt nhân viên.",
        data: {
          userId: employee._id,
          enrolled: true,
          enrolledAt: biometric.enrolledAt,
          updatedAt: biometric.updatedAt,
          enrollmentVersion: biometric.enrollmentVersion,
        },
      });
    }

    biometric = await EmployeeBiometric.create({
      userId: employee._id,
      descriptor,
      enrolledAt: new Date(),
      enrollmentVersion: 1,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Đăng ký khuôn mặt thành công.",
      data: {
        userId: employee._id,
        enrolled: true,
        enrolledAt: biometric.enrolledAt,
        updatedAt: biometric.updatedAt,
        enrollmentVersion: biometric.enrollmentVersion,
      },
    });
  } catch (error) {
    console.error("ENROLL FACE ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Nhân viên đã có dữ liệu khuôn mặt.",
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
      message: "Không thể đăng ký khuôn mặt.",
    });
  }
};

// POST /api/face/verify
const verifyFace = async (req, res) => {
  try {
    const userId = getUserId(req);
    const descriptor = Array.from(req.body?.descriptor || []);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được tài khoản.",
      });
    }

    if (!validateDescriptor(descriptor)) {
      return res.status(400).json({
        success: false,
        message: "Face descriptor không hợp lệ.",
      });
    }

    const employee = await User.findOne({
      _id: userId,
      role: "employee",
    }).select("_id name email role isActive");

    if (!employee) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản hiện tại không phải nhân viên.",
      });
    }

    if (!employee.isActive) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản nhân viên đang bị khóa.",
      });
    }

    const biometric = await EmployeeBiometric.findOne({
      userId: employee._id,
      isActive: true,
    });

    if (!biometric) {
      return res.status(404).json({
        success: false,
        message: "Nhân viên chưa đăng ký khuôn mặt.",
        enrolled: false,
      });
    }

    const distance = calculateEuclideanDistance(
      descriptor,
      biometric.descriptor
    );

    const matched = distance <= FACE_MATCH_THRESHOLD;

    if (!matched) {
      return res.status(401).json({
        success: false,
        matched: false,
        message: "Khuôn mặt không khớp với tài khoản.",
        distance: Number(distance.toFixed(4)),
      });
    }

    biometric.lastVerifiedAt = new Date();
    await biometric.save();

    return res.status(200).json({
      success: true,
      matched: true,
      message: "Xác thực khuôn mặt thành công.",
      data: {
        userId: employee._id,
        name: employee.name,
        distance: Number(distance.toFixed(4)),
        threshold: FACE_MATCH_THRESHOLD,
        lastVerifiedAt: biometric.lastVerifiedAt,
      },
    });
  } catch (error) {
    console.error("VERIFY FACE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể xác thực khuôn mặt.",
    });
  }
};

// DELETE /api/face/employee/:employeeId
const deleteFace = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId || !/^[a-f\d]{24}$/i.test(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "ID nhân viên không hợp lệ.",
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

    const deleted = await EmployeeBiometric.findOneAndDelete({
      userId: employee._id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Nhân viên chưa có dữ liệu khuôn mặt.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Đã xóa dữ liệu khuôn mặt.",
      data: {
        userId: employee._id,
        enrolled: false,
      },
    });
  } catch (error) {
    console.error("DELETE FACE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể xóa dữ liệu khuôn mặt.",
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
