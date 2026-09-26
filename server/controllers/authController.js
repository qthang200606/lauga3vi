const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);


// =========================================================
// GENERATE JWT
// =========================================================

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};


// =========================================================
// RESPONSE USER
// =========================================================

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  role: user.role,
  isActive: user.isActive !== false,
});


// =========================================================
// REGISTER
// POST /api/auth/register
//
// Đăng ký công khai = CUSTOMER
// Không cho client tự chọn role
// =========================================================

exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ thông tin.",
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
        message: "Email này đã được sử dụng!",
      });
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(
      password,
      salt
    );

    const newUser = await User.create({
      name: name.trim(),

      email: normalizedEmail,

      password: hashedPassword,

      phone: phone?.trim() || "",

      // TUYỆT ĐỐI KHÔNG lấy role từ req.body
      role: "customer",

      isActive: true,

      authProvider: "local",
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      message: "Đăng ký tài khoản thành công",

      token,

      user: formatUser(newUser),
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      message: "Lỗi máy chủ",
      error: error.message,
    });
  }
};


// =========================================================
// LOGIN
// POST /api/auth/login
//
// Dùng chung cho:
// customer
// employee
// admin
// =========================================================

exports.login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Vui lòng nhập email và mật khẩu.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(400).json({
        message: "Email hoặc mật khẩu không chính xác",
      });
    }

    // =========================================
    // TÀI KHOẢN BỊ KHÓA
    // =========================================

    if (user.isActive === false) {
      return res.status(403).json({
        message:
          "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.",
      });
    }

    // =========================================
    // TÀI KHOẢN GOOGLE
    // =========================================

    if (!user.password) {
      return res.status(400).json({
        message:
          "Tài khoản này sử dụng đăng nhập Google.",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Email hoặc mật khẩu không chính xác",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Đăng nhập thành công",

      token,

      user: formatUser(user),
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      message: "Lỗi máy chủ",
      error: error.message,
    });
  }
};


// =========================================================
// GOOGLE LOGIN
// POST /api/auth/google
// =========================================================

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message:
          "Không nhận được thông tin từ Google.",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({
        message:
          "Thông tin Google không hợp lệ.",
      });
    }

    const {
      sub: googleId,
      email,
      name,
      email_verified: emailVerified,
    } = payload;

    if (!email) {
      return res.status(400).json({
        message:
          "Không lấy được email từ tài khoản Google.",
      });
    }

    if (!emailVerified) {
      return res.status(401).json({
        message:
          "Email Google chưa được xác minh.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    // =========================================
    // TÌM USER
    // =========================================

    let user = await User.findOne({
      googleId,
    });

    if (!user) {
      user = await User.findOne({
        email: normalizedEmail,
      });
    }

    // =========================================
    // CHƯA CÓ USER
    // => TẠO CUSTOMER
    // =========================================

    if (!user) {
      user = await User.create({
        name:
          name?.trim() ||
          normalizedEmail.split("@")[0],

        email: normalizedEmail,

        password: "",

        phone: "",

        role: "customer",

        isActive: true,

        googleId,

        authProvider: "google",
      });
    }

    // =========================================
    // USER ĐÃ TỒN TẠI
    // =========================================

    else {
      // Tài khoản bị khóa
      if (user.isActive === false) {
        return res.status(403).json({
          message:
            "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.",
        });
      }

      // Nhân viên KHÔNG đăng nhập Google
      if (user.role === "employee") {
        return res.status(403).json({
          message:
            "Tài khoản nhân viên phải đăng nhập bằng email và mật khẩu do quản trị viên cấp.",
        });
      }

      // Nếu chưa có Google ID thì liên kết
      if (!user.googleId) {
        user.googleId = googleId;

        await user.save();
      }
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Đăng nhập Google thành công",

      token,

      user: formatUser(user),
    });
  } catch (error) {
    console.error(
      "GOOGLE LOGIN ERROR:",
      error
    );

    return res.status(401).json({
      message:
        "Đăng nhập Google thất bại hoặc phiên xác thực không hợp lệ.",
    });
  }
};


// =========================================================
// GET ME
// GET /api/auth/me
// =========================================================

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(
      req.user.id
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản.",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("GET ME ERROR:", error);

    return res.status(500).json({
      message: "Lỗi máy chủ",
    });
  }
};